import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  AuthService, 
  requireAuth, 
  requireParent, 
  requireDriver, 
  requireParentDataAccess,
  requireDriverDataAccess 
} from "./auth";
import { 
  insertUserSchema, 
  insertStudentSchema, 
  insertBookingSchema,
  insertStopSchema 
} from "@shared/schema";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const updateBookingSchema = z.object({
  status: z.enum(["confirmed", "cancelled"])
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ============= AUTHENTICATION ROUTES =============
  
  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await AuthService.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const sessionId = await AuthService.createSession(user.id);
      
      // Set secure cookie (httpOnly prevents XSS)
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        },
        sessionId 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', requireAuth, async (req, res) => {
    try {
      if (req.sessionId) {
        await AuthService.logout(req.sessionId);
      }
      res.clearCookie('sessionId');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });
  
  // Get current user endpoint
  app.get('/api/auth/me', requireAuth, async (req, res) => {
    res.json({ 
      user: { 
        id: req.user!.id, 
        name: req.user!.name, 
        email: req.user!.email, 
        role: req.user!.role 
      } 
    });
  });
  
  // ============= PARENT-ONLY ROUTES =============
  
  // Get parent's students
  app.get('/api/students', requireAuth, requireParentDataAccess, async (req, res) => {
    try {
      const students = await storage.getStudentsByParent(req.parentId!);
      res.json({ students });
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });
  
  // Create new student (parent only)
  app.post('/api/students', requireAuth, requireParentDataAccess, async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse({
        ...req.body,
        parentId: req.parentId // Ensure parent can only create their own students
      });
      
      const student = await storage.createStudent(studentData);
      res.status(201).json({ student });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(400).json({ error: 'Invalid student data' });
    }
  });
  
  // Get parent's bookings
  app.get('/api/bookings', requireAuth, requireParentDataAccess, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByParent(req.parentId!);
      res.json({ bookings });
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });
  
  // Create new booking (parent only)
  app.post('/api/bookings', requireAuth, requireParentDataAccess, async (req, res) => {
    try {
      // Verify the student belongs to the parent
      const parentStudents = await storage.getStudentsByParent(req.parentId!);
      const studentIds = parentStudents.map(s => s.id);
      
      if (!studentIds.includes(req.body.studentId)) {
        return res.status(403).json({ error: 'Cannot book for student that does not belong to you' });
      }
      
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.status(201).json({ booking });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(400).json({ error: 'Invalid booking data' });
    }
  });
  
  // Update booking (parent only - mainly for cancellations)
  app.patch('/api/bookings/:id', requireAuth, requireParentDataAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateBookingSchema.parse(req.body);
      
      // Verify the booking belongs to the parent
      const parentBookings = await storage.getBookingsByParent(req.parentId!);
      const parentBookingIds = parentBookings.map(b => b.id);
      
      if (!parentBookingIds.includes(id)) {
        return res.status(403).json({ error: 'Cannot modify booking that does not belong to you' });
      }
      
      const booking = await storage.updateBooking(id, updates);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      res.json({ booking });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(400).json({ error: 'Invalid booking update data' });
    }
  });
  
  // ============= DRIVER-ONLY ROUTES =============
  
  // Get driver's assigned routes
  app.get('/api/driver/assignments', requireAuth, requireDriverDataAccess, async (req, res) => {
    try {
      const assignments = await storage.getDriverAssignments(req.driverId!);
      res.json({ assignments });
    } catch (error) {
      console.error('Get driver assignments error:', error);
      res.status(500).json({ error: 'Failed to fetch driver assignments' });
    }
  });
  
  // ============= PUBLIC/SHARED ROUTES =============
  
  // Get all routes (public - needed for booking)
  app.get('/api/routes', async (req, res) => {
    try {
      const routes = await storage.getRoutes();
      res.json({ routes });
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ error: 'Failed to fetch routes' });
    }
  });
  
  // Get route details with stops (public - needed for booking)
  app.get('/api/routes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const route = await storage.getRoute(id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }
      
      const stops = await storage.getStopsByRoute(id);
      res.json({ route: { ...route, stops } });
    } catch (error) {
      console.error('Get route details error:', error);
      res.status(500).json({ error: 'Failed to fetch route details' });
    }
  });
  
  // ============= DRIVER STOP MANAGEMENT ROUTES =============
  
  // Get stops for a route (driver access)
  app.get('/api/driver/routes/:routeId/stops', requireAuth, requireDriver, requireDriverDataAccess, async (req, res) => {
    try {
      const { routeId } = req.params;
      const stops = await storage.getStopsByRoute(routeId);
      res.json({ stops });
    } catch (error) {
      console.error('Get route stops error:', error);
      res.status(500).json({ error: 'Failed to fetch route stops' });
    }
  });
  
  // Create a new stop (driver access)
  app.post('/api/driver/routes/:routeId/stops', requireAuth, requireDriver, requireDriverDataAccess, async (req, res) => {
    try {
      const { routeId } = req.params;
      const stopData = insertStopSchema.parse({ ...req.body, routeId });
      
      const stop = await storage.createStop(stopData);
      res.status(201).json({ stop });
    } catch (error) {
      console.error('Create stop error:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid stop data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create stop' });
      }
    }
  });
  
  // Update a stop (driver access)
  app.put('/api/driver/stops/:stopId', requireAuth, requireDriver, requireDriverDataAccess, async (req, res) => {
    try {
      const { stopId } = req.params;
      const updates = insertStopSchema.partial().parse(req.body);
      
      const stop = await storage.updateStop(stopId, updates);
      if (!stop) {
        return res.status(404).json({ error: 'Stop not found' });
      }
      
      res.json({ stop });
    } catch (error) {
      console.error('Update stop error:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid update data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update stop' });
      }
    }
  });
  
  // Delete a stop (driver access)
  app.delete('/api/driver/stops/:stopId', requireAuth, requireDriver, requireDriverDataAccess, async (req, res) => {
    try {
      const { stopId } = req.params;
      const deleted = await storage.deleteStop(stopId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Stop not found' });
      }
      
      res.json({ message: 'Stop deleted successfully' });
    } catch (error) {
      console.error('Delete stop error:', error);
      res.status(500).json({ error: 'Failed to delete stop' });
    }
  });
  
  // ============= SECURITY TEST ENDPOINT (Remove in production) =============
  
  // This endpoint helps verify that role-based access control is working
  app.get('/api/test/parent-only', requireAuth, requireParent, (req, res) => {
    res.json({ message: 'Success: You have parent access', userId: req.user!.id });
  });
  
  app.get('/api/test/driver-only', requireAuth, requireDriver, (req, res) => {
    res.json({ message: 'Success: You have driver access', userId: req.user!.id });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
