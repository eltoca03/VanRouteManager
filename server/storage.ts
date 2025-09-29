import { 
  type User, 
  type InsertUser, 
  type Session, 
  type InsertSession,
  type Student,
  type InsertStudent,
  type Booking,
  type InsertBooking,
  type Route,
  type InsertRoute,
  type Stop,
  type InsertStop,
  type DriverAssignment,
  type InsertDriverAssignment 
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Students (parent access only)
  getStudentsByParent(parentId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Bookings (parent access only)
  getBookingsByParent(parentId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  // Routes (public read, driver control)
  getRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route | undefined>;
  updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined>;
  
  // Stops (driver management)
  getStopsByRoute(routeId: string): Promise<Stop[]>;
  getStop(id: string): Promise<Stop | undefined>;
  createStop(stop: InsertStop): Promise<Stop>;
  updateStop(id: string, updates: Partial<Stop>): Promise<Stop | undefined>;
  deleteStop(id: string): Promise<boolean>;
  
  // Driver assignments (driver access only)
  getDriverAssignments(driverId: string): Promise<DriverAssignment[]>;
  createDriverAssignment(assignment: InsertDriverAssignment): Promise<DriverAssignment>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private students: Map<string, Student>;
  private bookings: Map<string, Booking>;
  private routes: Map<string, Route>;
  private stops: Map<string, Stop>;
  private driverAssignments: Map<string, DriverAssignment>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.students = new Map();
    this.bookings = new Map();
    this.routes = new Map();
    this.stops = new Map();
    this.driverAssignments = new Map();
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    try {
      // Create demo parent user
      const parentPasswordHash = await bcrypt.hash('password123', 12);
      const demoParent: User = {
        id: 'demo-parent-1',
        name: 'Sarah Johnson',
        email: 'parent@demo.com',
        passwordHash: parentPasswordHash,
        phone: '+1-555-0123',
        role: 'parent',
        isActive: true,
        createdAt: new Date()
      };
      this.users.set(demoParent.id, demoParent);
      
      // Create demo driver user
      const driverPasswordHash = await bcrypt.hash('password123', 12);
      const demoDriver: User = {
        id: 'demo-driver-1',
        name: 'Mike Rodriguez',
        email: 'driver@demo.com',
        passwordHash: driverPasswordHash,
        phone: '+1-555-0456',
        role: 'driver',
        isActive: true,
        createdAt: new Date()
      };
      this.users.set(demoDriver.id, demoDriver);
      
      console.log('Demo users created:');
      console.log('- Parent: parent@demo.com / password123');
      console.log('- Driver: driver@demo.com / password123');
      
      // Create demo routes
      const friscoRoute: Route = {
        id: 'route-frisco-1',
        name: 'Frisco Route',
        area: 'frisco',
        capacity: 14
      };
      this.routes.set(friscoRoute.id, friscoRoute);
      
      const dallasRoute: Route = {
        id: 'route-dallas-1',
        name: 'Dallas Route',
        area: 'dallas',
        capacity: 14
      };
      this.routes.set(dallasRoute.id, dallasRoute);
      
      // Create demo stops for Frisco Route
      const friscoStops: Stop[] = [
        {
          id: 'stop-frisco-1',
          routeId: friscoRoute.id,
          name: 'Main Street Plaza',
          address: '123 Main St, Frisco, TX 75034',
          morningTime: '07:30',
          afternoonTime: '15:45',
          order: 1
        },
        {
          id: 'stop-frisco-2',
          routeId: friscoRoute.id,
          name: 'Community Center',
          address: '456 Oak Ave, Frisco, TX 75035',
          morningTime: '07:45',
          afternoonTime: '16:00',
          order: 2
        },
        {
          id: 'stop-frisco-3',
          routeId: friscoRoute.id,
          name: 'Soccer Academy',
          address: '789 Sports Dr, Frisco, TX 75033',
          morningTime: '08:00',
          afternoonTime: '16:15',
          order: 3
        }
      ];
      
      friscoStops.forEach(stop => this.stops.set(stop.id, stop));
      
      // Create driver assignment
      const driverAssignment: DriverAssignment = {
        id: 'assignment-1',
        driverId: demoDriver.id,
        routeId: friscoRoute.id,
        timeSlot: 'morning',
        isActive: true
      };
      this.driverAssignments.set(driverAssignment.id, driverAssignment);
      
    } catch (error) {
      console.error('Error creating demo data:', error);
    }
  }

  // User authentication
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      isActive: insertUser.isActive ?? true,
      phone: insertUser.phone ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Session management
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = { 
      ...insertSession, 
      id, 
      createdAt: new Date() 
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(id);
      return undefined;
    }
    
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  // Students (parent access only)
  async getStudentsByParent(parentId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.parentId === parentId
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...insertStudent, id };
    this.students.set(id, student);
    return student;
  }

  // Bookings (parent access only)
  async getBookingsByParent(parentId: string): Promise<Booking[]> {
    const parentStudents = await this.getStudentsByParent(parentId);
    const studentIds = parentStudents.map(s => s.id);
    return Array.from(this.bookings.values()).filter(
      (booking) => studentIds.includes(booking.studentId)
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      status: insertBooking.status ?? "confirmed"
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Routes (public read, driver control)
  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: string): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    const existingRoute = this.routes.get(id);
    if (!existingRoute) {
      return undefined;
    }
    
    const updatedRoute = { ...existingRoute, ...updates };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  // Stops
  async getStopsByRoute(routeId: string): Promise<Stop[]> {
    return Array.from(this.stops.values())
      .filter((stop) => stop.routeId === routeId)
      .sort((a, b) => a.order - b.order);
  }

  async getStop(id: string): Promise<Stop | undefined> {
    return this.stops.get(id);
  }

  async createStop(insertStop: InsertStop): Promise<Stop> {
    const id = randomUUID();
    const stop: Stop = {
      id,
      ...insertStop,
    };
    this.stops.set(id, stop);
    return stop;
  }

  async updateStop(id: string, updates: Partial<Stop>): Promise<Stop | undefined> {
    const existingStop = this.stops.get(id);
    if (!existingStop) {
      return undefined;
    }
    
    const updatedStop = { ...existingStop, ...updates };
    this.stops.set(id, updatedStop);
    return updatedStop;
  }

  async deleteStop(id: string): Promise<boolean> {
    return this.stops.delete(id);
  }

  // Driver assignments (driver access only)
  async getDriverAssignments(driverId: string): Promise<DriverAssignment[]> {
    return Array.from(this.driverAssignments.values()).filter(
      (assignment) => assignment.driverId === driverId
    );
  }

  async createDriverAssignment(insertAssignment: InsertDriverAssignment): Promise<DriverAssignment> {
    const id = randomUUID();
    const assignment: DriverAssignment = { 
      ...insertAssignment, 
      id,
      isActive: insertAssignment.isActive ?? true
    };
    this.driverAssignments.set(id, assignment);
    return assignment;
  }
}

export const storage = new MemStorage();
