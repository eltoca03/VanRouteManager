# Soccer Academy Transportation System

## Overview

A comprehensive web application for managing soccer academy transportation services. The system provides real-time route management, student booking capabilities, and driver coordination for Frisco and Dallas area routes. Built with a modern React frontend and Express backend, the application serves parents who need to book transportation for their children and drivers who manage van routes and student manifests.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application using modern React patterns with TypeScript for type safety
- **Tailwind CSS + Shadcn/ui**: Utility-first CSS framework with a comprehensive component library for consistent design
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation for parents and drivers
- **Context-Based State Management**: Authentication context for user session management with React Query for server state
- **Role-Based UI**: Conditional rendering based on user roles (parent vs driver) with dedicated dashboards

### Backend Architecture
- **Express.js with TypeScript**: RESTful API server with type-safe route handlers
- **Session-Based Authentication**: Secure cookie-based sessions with bcrypt password hashing
- **Role-Based Access Control**: Middleware enforcement for parent and driver specific endpoints
- **Modular Route Structure**: Organized API endpoints for authentication, bookings, students, and routes

### Database Design
- **PostgreSQL with Drizzle ORM**: Type-safe database operations with schema migrations
- **User Management**: Supports parent and driver roles with account activation status
- **Student-Parent Relationships**: Each student linked to a parent user account
- **Route and Stop Management**: Hierarchical structure for routes containing multiple stops
- **Booking System**: Links students to specific routes, stops, and time slots
- **Driver Assignments**: Associates drivers with routes for shift management

### Authentication & Authorization
- **Session Management**: HTTP-only cookies with 7-day expiration for security
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Role-Based Middleware**: Separate middleware for parent and driver access control
- **Data Isolation**: Parents can only access their own students and bookings; drivers only see assigned routes

### Design System
- **Color-Coded Safety First**: High-contrast color palette emphasizing child safety information
- **Capacity Visualization**: Real-time seat availability using filled circle indicators (14-seat capacity)
- **Time-Sensitive Displays**: Clear typography for schedules using tabular numbers
- **Transportation-Inspired UX**: Design patterns borrowed from ride-sharing and school management applications

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for Neon cloud database
- **drizzle-orm**: Type-safe database operations and schema management
- **@tanstack/react-query**: Server state management and caching for React frontend

### UI Component Library
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives (dialogs, dropdowns, forms, navigation)
- **tailwindcss**: Utility-first CSS framework for responsive design
- **class-variance-authority**: Type-safe component variant handling
- **lucide-react**: Modern icon library for consistent iconography

### Authentication & Security
- **bcrypt**: Password hashing for secure credential storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **@hookform/resolvers**: Form validation with Zod schema integration

### Development Tools
- **vite**: Fast development build tool with hot module replacement
- **typescript**: Type safety across frontend and backend
- **@replit/vite-plugin-***: Replit-specific development enhancements for debugging and deployment

### Email Integration
- **@sendgrid/mail**: Email service for booking confirmations and notifications (configured but not yet implemented)

### Build & Deployment
- **esbuild**: Fast JavaScript bundler for production server builds
- **tsx**: TypeScript execution engine for development server