import { db } from "./db";
import { users, students, routes, stops, driverAssignments, bookings } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Create demo parent user
    const parentPasswordHash = await bcrypt.hash('password123', 12);
    const [demoParent] = await db.insert(users).values({
      email: 'parent@demo.com',
      passwordHash: parentPasswordHash,
      name: 'Sarah Johnson',
      phone: '+1-555-0123',
      role: 'parent',
      status: 'approved',
      isActive: true,
    }).returning();
    
    // Create demo driver user
    const driverPasswordHash = await bcrypt.hash('password123', 12);
    const [demoDriver] = await db.insert(users).values({
      email: 'driver@demo.com',
      passwordHash: driverPasswordHash,
      name: 'Mike Rodriguez',
      phone: '+1-555-0456',
      role: 'driver',
      status: 'approved',
      isActive: true,
    }).returning();
    
    console.log('✓ Demo users created:');
    console.log('  - Parent: parent@demo.com / password123');
    console.log('  - Driver: driver@demo.com / password123');
    
    // Create demo students for parent
    const [student1] = await db.insert(students).values({
      name: 'Alex Johnson',
      grade: '4th',
      parentId: demoParent.id,
      parentName: demoParent.name,
      parentEmail: demoParent.email,
      parentPhone: demoParent.phone || '+1-555-0123'
    }).returning();
    
    const [student2] = await db.insert(students).values({
      name: 'Emma Davis',
      grade: '6th',
      parentId: demoParent.id,
      parentName: demoParent.name,
      parentEmail: demoParent.email,
      parentPhone: demoParent.phone || '+1-555-0123'
    }).returning();
    
    console.log('✓ Demo students created');
    
    // Create demo routes
    const [friscoRoute] = await db.insert(routes).values({
      name: 'Frisco Route',
      area: 'frisco',
      capacity: 14
    }).returning();
    
    const [dallasRoute] = await db.insert(routes).values({
      name: 'Dallas Route',
      area: 'dallas',
      capacity: 14
    }).returning();
    
    console.log('✓ Routes created');
    
    // Create demo stops for Frisco Route
    const [friscoStop1] = await db.insert(stops).values({
      routeId: friscoRoute.id,
      name: 'Main Street Plaza',
      address: '123 Main St, Frisco, TX 75034',
      morningOrder: 1,
      afternoonOrder: 3,
      morningPickupTime: '07:30',
      afternoonDropoffTime: '15:45',
      fridayMorningPickupTime: '07:30',
      fridayAfternoonDropoffTime: '14:45',
      earlyReleaseMorningPickupTime: '07:30',
      earlyReleaseAfternoonDropoffTime: '13:45'
    }).returning();
    
    const [friscoStop2] = await db.insert(stops).values({
      routeId: friscoRoute.id,
      name: 'Community Center',
      address: '456 Oak Ave, Frisco, TX 75035',
      morningOrder: 2,
      afternoonOrder: 2,
      morningPickupTime: '07:45',
      afternoonDropoffTime: '16:00',
      fridayMorningPickupTime: '07:45',
      fridayAfternoonDropoffTime: '15:00',
      earlyReleaseMorningPickupTime: '07:45',
      earlyReleaseAfternoonDropoffTime: '14:00'
    }).returning();
    
    const [friscoStop3] = await db.insert(stops).values({
      routeId: friscoRoute.id,
      name: 'Soccer Academy',
      address: '789 Sports Dr, Frisco, TX 75033',
      morningOrder: 3,
      afternoonOrder: 1,
      morningPickupTime: '08:00',
      afternoonDropoffTime: '16:15',
      fridayMorningPickupTime: '08:00',
      fridayAfternoonDropoffTime: '15:15',
      earlyReleaseMorningPickupTime: '08:00',
      earlyReleaseAfternoonDropoffTime: '14:15'
    }).returning();
    
    // Create demo stops for Dallas Route
    await db.insert(stops).values([
      {
        routeId: dallasRoute.id,
        name: 'Downtown Station',
        address: '100 Commerce St, Dallas, TX 75202',
        morningOrder: 1,
        afternoonOrder: 3,
        morningPickupTime: '07:15',
        afternoonDropoffTime: '15:30',
        fridayMorningPickupTime: '07:15',
        fridayAfternoonDropoffTime: '14:30',
        earlyReleaseMorningPickupTime: '07:15',
        earlyReleaseAfternoonDropoffTime: '13:30'
      },
      {
        routeId: dallasRoute.id,
        name: 'Park Plaza',
        address: '200 Elm St, Dallas, TX 75201',
        morningOrder: 2,
        afternoonOrder: 2,
        morningPickupTime: '07:30',
        afternoonDropoffTime: '15:45',
        fridayMorningPickupTime: '07:30',
        fridayAfternoonDropoffTime: '14:45',
        earlyReleaseMorningPickupTime: '07:30',
        earlyReleaseAfternoonDropoffTime: '13:45'
      },
      {
        routeId: dallasRoute.id,
        name: 'Sports Complex',
        address: '300 Victory Ave, Dallas, TX 75219',
        morningOrder: 3,
        afternoonOrder: 1,
        morningPickupTime: '07:45',
        afternoonDropoffTime: '16:00',
        fridayMorningPickupTime: '07:45',
        fridayAfternoonDropoffTime: '15:00',
        earlyReleaseMorningPickupTime: '07:45',
        earlyReleaseAfternoonDropoffTime: '14:00'
      }
    ]);
    
    console.log('✓ Stops created');
    
    // Create driver assignment
    await db.insert(driverAssignments).values({
      driverId: demoDriver.id,
      routeId: friscoRoute.id,
      timeSlot: 'morning',
      isActive: true
    });
    
    console.log('✓ Driver assignment created');
    
    // Create demo bookings for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await db.insert(bookings).values([
      {
        studentId: student1.id,
        routeId: friscoRoute.id,
        stopId: friscoStop1.id,
        date: today,
        timeSlot: 'morning',
        status: 'confirmed'
      },
      {
        studentId: student2.id,
        routeId: friscoRoute.id,
        stopId: friscoStop2.id,
        date: today,
        timeSlot: 'morning',
        status: 'confirmed'
      },
      {
        studentId: student1.id,
        routeId: friscoRoute.id,
        stopId: friscoStop3.id,
        date: today,
        timeSlot: 'afternoon',
        status: 'confirmed'
      }
    ]);
    
    console.log('✓ Demo bookings created');
    console.log('\n✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
