import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  grade: text("grade").notNull(), // "3rd", "4th", "5th", "6th", "7th"
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

// Driver tracking for real-time location
export const driverSessions = pgTable("driver_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => routes.id),
  driverId: text("driver_id").notNull(),
  isActive: boolean("is_active").default(false),
  currentLat: text("current_lat"),
  currentLng: text("current_lng"),
  timeSlot: text("time_slot").notNull(), // "morning" or "afternoon"
  date: timestamp("date").notNull(),
  lastUpdated: timestamp("last_updated").default(sql`now()`),
});

// Create insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertRouteSchema = createInsertSchema(routes).omit({ id: true });
export const insertStopSchema = createInsertSchema(stops).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertDriverSessionSchema = createInsertSchema(driverSessions).omit({ id: true, lastUpdated: true });

// Types
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

export type InsertStop = z.infer<typeof insertStopSchema>;
export type Stop = typeof stops.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

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