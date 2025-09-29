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
  type Stop,
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
  
  // Stops
  getStopsByRoute(routeId: string): Promise<Stop[]>;
  
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
      
    } catch (error) {
      console.error('Error creating demo users:', error);
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

  // Stops
  async getStopsByRoute(routeId: string): Promise<Stop[]> {
    return Array.from(this.stops.values()).filter(
      (stop) => stop.routeId === routeId
    );
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
