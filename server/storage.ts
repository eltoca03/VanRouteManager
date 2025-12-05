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
  type InsertDriverAssignment,
  users,
  sessions,
  students,
  bookings,
  routes,
  stops,
  driverAssignments
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Parent approval (driver only)
  getPendingParents(): Promise<User[]>;
  approveParent(parentId: string): Promise<User | undefined>;
  rejectParent(parentId: string): Promise<User | undefined>;
  
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Students (parent access only)
  getStudentsByParent(parentId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentById(studentId: string): Promise<Student | undefined>;
  
  // Bookings (parent access only)
  getBookingsByParent(parentId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  
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

export class DatabaseStorage implements IStorage {
  // User authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Parent approval (driver only)
  async getPendingParents(): Promise<User[]> {
    return await db.select().from(users).where(
      and(eq(users.role, 'parent'), eq(users.status, 'pending'))
    );
  }

  async approveParent(parentId: string): Promise<User | undefined> {
    return this.updateUser(parentId, { status: 'approved' });
  }

  async rejectParent(parentId: string): Promise<User | undefined> {
    return this.updateUser(parentId, { status: 'rejected' });
  }

  // Session management
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.id, id));
      return undefined;
    }
    
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, id));
    return true;
  }

  // Students (parent access only)
  async getStudentsByParent(parentId: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.parentId, parentId));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async getStudentById(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, studentId));
    return student || undefined;
  }

  // Bookings (parent access only)
  async getBookingsByParent(parentId: string): Promise<any[]> {
    const parentStudents = await this.getStudentsByParent(parentId);
    const studentIds = parentStudents.map(s => s.id);
    
    if (studentIds.length === 0) return [];
    
    const rawBookings = await db.select().from(bookings).where(
      eq(bookings.studentId, studentIds[0])
    );

    // Enrich bookings with related data
    const enrichedBookings = await Promise.all(
      rawBookings.map(async (booking) => {
        const student = parentStudents.find(s => s.id === booking.studentId);
        const [route] = await db.select().from(routes).where(eq(routes.id, booking.routeId));
        const [stop] = await db.select().from(stops).where(eq(stops.id, booking.stopId));
        
        // Format date as user-friendly string
        const bookingDate = new Date(booking.date);
        const formattedDate = bookingDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // Format time based on time slot and stop
        let formattedTime = '8:00 AM';
        if (stop) {
          if (booking.timeSlot === 'morning' && stop.morningPickupTime) {
            const time = stop.morningPickupTime.split(':');
            const hour = parseInt(time[0]);
            const minute = time[1];
            formattedTime = hour > 12 ? `${hour - 12}:${minute} PM` : `${hour}:${minute} AM`;
          } else if (booking.timeSlot === 'afternoon' && stop.afternoonDropoffTime) {
            const time = stop.afternoonDropoffTime.split(':');
            const hour = parseInt(time[0]);
            const minute = time[1];
            formattedTime = hour > 12 ? `${hour - 12}:${minute} PM` : `${hour}:${minute} AM`;
          }
        }

        return {
          ...booking,
          studentName: student?.name || 'Unknown Student',
          route: route?.name || 'Unknown Route',
          stop: stop?.name || 'Unknown Stop',
          date: formattedDate,
          time: formattedTime
        };
      })
    );

    return enrichedBookings;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return booking || undefined;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  // Routes (public read, driver control)
  async getRoutes(): Promise<Route[]> {
    return await db.select().from(routes);
  }

  async getRoute(id: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    const [route] = await db.update(routes).set(updates).where(eq(routes.id, id)).returning();
    return route || undefined;
  }

  // Stops (driver management)
  async getStopsByRoute(routeId: string): Promise<Stop[]> {
    return await db.select().from(stops).where(eq(stops.routeId, routeId));
  }

  async getStop(id: string): Promise<Stop | undefined> {
    const [stop] = await db.select().from(stops).where(eq(stops.id, id));
    return stop || undefined;
  }

  async createStop(insertStop: InsertStop): Promise<Stop> {
    const [stop] = await db.insert(stops).values(insertStop).returning();
    return stop;
  }

  async updateStop(id: string, updates: Partial<Stop>): Promise<Stop | undefined> {
    const [stop] = await db.update(stops).set(updates).where(eq(stops.id, id)).returning();
    return stop || undefined;
  }

  async deleteStop(id: string): Promise<boolean> {
    await db.delete(stops).where(eq(stops.id, id));
    return true;
  }

  // Driver assignments (driver access only)
  async getDriverAssignments(driverId: string): Promise<DriverAssignment[]> {
    return await db.select().from(driverAssignments).where(eq(driverAssignments.driverId, driverId));
  }

  async createDriverAssignment(insertAssignment: InsertDriverAssignment): Promise<DriverAssignment> {
    const [assignment] = await db.insert(driverAssignments).values(insertAssignment).returning();
    return assignment;
  }
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
        status: 'approved',
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
        status: 'approved',
        isActive: true,
        createdAt: new Date()
      };
      this.users.set(demoDriver.id, demoDriver);
      
      console.log('Demo users created:');
      console.log('- Parent: parent@demo.com / password123');
      console.log('- Driver: driver@demo.com / password123');
      
      // Create demo students for parent
      const demoStudents: Student[] = [
        {
          id: 'student-1',
          name: 'Alex Johnson',
          grade: '4th',
          parentId: demoParent.id,
          parentName: demoParent.name,
          parentEmail: demoParent.email,
          parentPhone: demoParent.phone || '+1-555-0123'
        },
        {
          id: 'student-2',
          name: 'Emma Davis',
          grade: '6th',
          parentId: demoParent.id,
          parentName: demoParent.name,
          parentEmail: demoParent.email,
          parentPhone: demoParent.phone || '+1-555-0123'
        }
      ];
      
      demoStudents.forEach(student => this.students.set(student.id, student));
      
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
      // Morning: A→B→C (1,2,3), Afternoon: C→B→A (3,2,1) - reversed order
      const friscoStops: Stop[] = [
        {
          id: 'stop-frisco-1',
          routeId: friscoRoute.id,
          name: 'Main Street Plaza',
          address: '123 Main St, Frisco, TX 75034',
          morningOrder: 1, // First pickup
          afternoonOrder: 3, // Last dropoff
          // Regular days (Mon-Thu)
          morningPickupTime: '07:30',
          afternoonDropoffTime: '15:45',
          // Friday schedule
          fridayMorningPickupTime: '07:30',
          fridayAfternoonDropoffTime: '14:45', // Earlier on Friday
          // Early release schedule
          earlyReleaseMorningPickupTime: '07:30',
          earlyReleaseAfternoonDropoffTime: '13:45'
        },
        {
          id: 'stop-frisco-2',
          routeId: friscoRoute.id,
          name: 'Community Center',
          address: '456 Oak Ave, Frisco, TX 75035',
          morningOrder: 2, // Second pickup
          afternoonOrder: 2, // Second dropoff
          // Regular days
          morningPickupTime: '07:45',
          afternoonDropoffTime: '16:00',
          // Friday schedule
          fridayMorningPickupTime: '07:45',
          fridayAfternoonDropoffTime: '15:00',
          // Early release schedule
          earlyReleaseMorningPickupTime: '07:45',
          earlyReleaseAfternoonDropoffTime: '14:00'
        },
        {
          id: 'stop-frisco-3',
          routeId: friscoRoute.id,
          name: 'Soccer Academy',
          address: '789 Sports Dr, Frisco, TX 75033',
          morningOrder: 3, // Last pickup (arrives at school)
          afternoonOrder: 1, // First dropoff (leaves from school)
          // Regular days
          morningPickupTime: '08:00',
          afternoonDropoffTime: '16:15',
          // Friday schedule
          fridayMorningPickupTime: '08:00',
          fridayAfternoonDropoffTime: '15:15',
          // Early release schedule
          earlyReleaseMorningPickupTime: '08:00',
          earlyReleaseAfternoonDropoffTime: '14:15'
        }
      ];
      
      friscoStops.forEach(stop => this.stops.set(stop.id, stop));
      
      // Create demo stops for Dallas Route
      // Morning: A→B→C (1,2,3), Afternoon: C→B→A (3,2,1) - reversed order
      const dallasStops: Stop[] = [
        {
          id: 'stop-dallas-1',
          routeId: dallasRoute.id,
          name: 'Downtown Station',
          address: '100 Commerce St, Dallas, TX 75202',
          morningOrder: 1, // First pickup
          afternoonOrder: 3, // Last dropoff
          // Regular days (Mon-Thu)
          morningPickupTime: '07:15',
          afternoonDropoffTime: '15:30',
          // Friday schedule
          fridayMorningPickupTime: '07:15',
          fridayAfternoonDropoffTime: '14:30', // Earlier on Friday
          // Early release schedule
          earlyReleaseMorningPickupTime: '07:15',
          earlyReleaseAfternoonDropoffTime: '13:30'
        },
        {
          id: 'stop-dallas-2',
          routeId: dallasRoute.id,
          name: 'Park Plaza',
          address: '200 Elm St, Dallas, TX 75201',
          morningOrder: 2, // Second pickup
          afternoonOrder: 2, // Second dropoff
          // Regular days
          morningPickupTime: '07:30',
          afternoonDropoffTime: '15:45',
          // Friday schedule
          fridayMorningPickupTime: '07:30',
          fridayAfternoonDropoffTime: '14:45',
          // Early release schedule
          earlyReleaseMorningPickupTime: '07:30',
          earlyReleaseAfternoonDropoffTime: '13:45'
        },
        {
          id: 'stop-dallas-3',
          routeId: dallasRoute.id,
          name: 'Sports Complex',
          address: '300 Victory Ave, Dallas, TX 75219',
          morningOrder: 3, // Last pickup (arrives at school)
          afternoonOrder: 1, // First dropoff (leaves from school)
          // Regular days
          morningPickupTime: '07:45',
          afternoonDropoffTime: '16:00',
          // Friday schedule
          fridayMorningPickupTime: '07:45',
          fridayAfternoonDropoffTime: '15:00',
          // Early release schedule
          earlyReleaseMorningPickupTime: '07:45',
          earlyReleaseAfternoonDropoffTime: '14:00'
        }
      ];
      
      dallasStops.forEach(stop => this.stops.set(stop.id, stop));
      
      // Create driver assignment
      const driverAssignment: DriverAssignment = {
        id: 'assignment-1',
        driverId: demoDriver.id,
        routeId: friscoRoute.id,
        timeSlot: 'morning',
        isActive: true
      };
      this.driverAssignments.set(driverAssignment.id, driverAssignment);

      // Create demo confirmed bookings for driver dashboard testing
      const today = new Date();
      
      const demoBookings: Booking[] = [
        {
          id: 'booking-demo-1',
          studentId: 'student-1',
          routeId: friscoRoute.id,
          stopId: 'stop-frisco-1', // Main Street Plaza (order 1)
          date: today,
          timeSlot: 'morning',
          status: 'confirmed',
          createdAt: new Date()
        },
        {
          id: 'booking-demo-2',
          studentId: 'student-2',
          routeId: friscoRoute.id,
          stopId: 'stop-frisco-2', // Community Center (order 2)
          date: today,
          timeSlot: 'morning',
          status: 'confirmed',
          createdAt: new Date()
        },
        {
          id: 'booking-demo-3',
          studentId: 'student-1',
          routeId: friscoRoute.id,
          stopId: 'stop-frisco-3', // Soccer Academy (order 3)
          date: today,
          timeSlot: 'afternoon',
          status: 'confirmed',
          createdAt: new Date()
        }
      ];

      demoBookings.forEach(booking => this.bookings.set(booking.id, booking));
      console.log(`Created ${demoBookings.length} demo bookings for driver testing`);
      console.log('Demo bookings:', demoBookings.map(b => `${b.id}: Student ${b.studentId} at Stop ${b.stopId} (${b.timeSlot}, ${b.status}, ${b.date})`));
      
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
      phone: insertUser.phone ?? null,
      status: insertUser.status ?? 'pending'
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
  
  // Parent approval (driver only)
  async getPendingParents(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === 'parent' && user.status === 'pending');
  }
  
  async approveParent(parentId: string): Promise<User | undefined> {
    return this.updateUser(parentId, { status: 'approved' });
  }
  
  async rejectParent(parentId: string): Promise<User | undefined> {
    return this.updateUser(parentId, { status: 'rejected' });
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

  async getStudentById(studentId: string): Promise<Student | undefined> {
    return this.students.get(studentId);
  }

  // Bookings (parent access only)
  async getBookingsByParent(parentId: string): Promise<any[]> {
    const parentStudents = await this.getStudentsByParent(parentId);
    const studentIds = parentStudents.map(s => s.id);
    const rawBookings = Array.from(this.bookings.values()).filter(
      (booking) => studentIds.includes(booking.studentId)
    );

    // Enrich bookings with related data
    const enrichedBookings = await Promise.all(
      rawBookings.map(async (booking) => {
        const student = parentStudents.find(s => s.id === booking.studentId);
        const route = this.routes.get(booking.routeId);
        const stop = this.stops.get(booking.stopId);
        
        // Format date as user-friendly string
        const bookingDate = new Date(booking.date);
        const formattedDate = bookingDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // Format time based on time slot and stop
        let formattedTime = '8:00 AM';
        if (stop) {
          if (booking.timeSlot === 'morning' && stop.morningPickupTime) {
            const time = stop.morningPickupTime.split(':');
            const hour = parseInt(time[0]);
            const minute = time[1];
            formattedTime = hour > 12 ? `${hour - 12}:${minute} PM` : `${hour}:${minute} AM`;
          } else if (booking.timeSlot === 'afternoon' && stop.afternoonDropoffTime) {
            const time = stop.afternoonDropoffTime.split(':');
            const hour = parseInt(time[0]);
            const minute = time[1];
            formattedTime = hour > 12 ? `${hour - 12}:${minute} PM` : `${hour}:${minute} AM`;
          }
        }

        return {
          ...booking,
          studentName: student?.name || 'Unknown Student',
          route: route?.name || 'Unknown Route',
          stop: stop?.name || 'Unknown Stop',
          date: formattedDate,
          time: formattedTime
        };
      })
    );

    return enrichedBookings;
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

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
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
      .sort((a, b) => a.morningOrder - b.morningOrder); // Default to morning pickup order
  }

  async getStop(id: string): Promise<Stop | undefined> {
    return this.stops.get(id);
  }

  async createStop(insertStop: InsertStop): Promise<Stop> {
    const id = randomUUID();
    const stop: Stop = {
      id,
      ...insertStop,
      // Ensure all time fields have proper null values if not provided
      morningPickupTime: insertStop.morningPickupTime || null,
      afternoonDropoffTime: insertStop.afternoonDropoffTime || null,
      fridayMorningPickupTime: insertStop.fridayMorningPickupTime || null,
      fridayAfternoonDropoffTime: insertStop.fridayAfternoonDropoffTime || null,
      earlyReleaseMorningPickupTime: insertStop.earlyReleaseMorningPickupTime || null,
      earlyReleaseAfternoonDropoffTime: insertStop.earlyReleaseAfternoonDropoffTime || null,
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

export const storage = new DatabaseStorage();
