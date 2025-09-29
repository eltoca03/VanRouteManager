import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, time, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull(), // "parent" or "driver"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  grade: text("grade").notNull(), // "3rd", "4th", "5th", "6th", "7th"
  parentId: varchar("parent_id").notNull().references(() => users.id), // Link to parent user
  parentName: text("parent_name").notNull(),
  parentEmail: text("parent_email").notNull(),
  parentPhone: text("parent_phone").notNull(),
});

// Routes table (Frisco and Dallas)
export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Frisco Route" or "Dallas Route"
  area: text("area").notNull(), // "frisco" or "dallas"
  capacity: integer("capacity").notNull().default(14),
});

// Stops for each route
export const stops = pgTable("stops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => routes.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  morningTime: time("morning_time"), // pickup time for morning route
  afternoonTime: time("afternoon_time"), // pickup time for afternoon route
  order: integer("order").notNull(), // stop order in route
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  routeId: varchar("route_id").notNull().references(() => routes.id),
  stopId: varchar("stop_id").notNull().references(() => stops.id),
  date: timestamp("date").notNull(),
  timeSlot: text("time_slot").notNull(), // "morning" or "afternoon"
  status: text("status").notNull().default("confirmed"), // "confirmed", "cancelled"
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Driver assignments - links drivers to specific routes
export const driverAssignments = pgTable("driver_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  routeId: varchar("route_id").notNull().references(() => routes.id),
  timeSlot: text("time_slot").notNull(), // "morning" or "afternoon"
  isActive: boolean("is_active").default(true),
});

// Driver tracking for real-time location
export const driverSessions = pgTable("driver_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => routes.id),
  driverId: varchar("driver_id").notNull().references(() => users.id), // Link to driver user
  isActive: boolean("is_active").default(false),
  currentLat: text("current_lat"),
  currentLng: text("current_lng"),
  timeSlot: text("time_slot").notNull(), // "morning" or "afternoon"
  date: timestamp("date").notNull(),
  lastUpdated: timestamp("last_updated").default(sql`now()`),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertRouteSchema = createInsertSchema(routes).omit({ id: true });
export const insertStopSchema = createInsertSchema(stops).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertDriverAssignmentSchema = createInsertSchema(driverAssignments).omit({ id: true });
export const insertDriverSessionSchema = createInsertSchema(driverSessions).omit({ id: true, lastUpdated: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

export type InsertStop = z.infer<typeof insertStopSchema>;
export type Stop = typeof stops.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertDriverAssignment = z.infer<typeof insertDriverAssignmentSchema>;
export type DriverAssignment = typeof driverAssignments.$inferSelect;

export type InsertDriverSession = z.infer<typeof insertDriverSessionSchema>;
export type DriverSession = typeof driverSessions.$inferSelect;

// Extended types for frontend
export type BookingWithDetails = Booking & {
  student: Student;
  route: Route;
  stop: Stop;
};

export type RouteWithStops = Route & {
  stops: Stop[];
};

export type StopWithBookings = Stop & {
  bookings: BookingWithDetails[];
  availableSeats: number;
};