# FitFlow - Group Fitness Trainer Platform

## Overview

FitFlow is a comprehensive web application designed to empower group fitness trainers to create, organize, and deliver structured workout routines with seamless presentation capabilities. The platform provides tools for routine creation, exercise management, calendar scheduling, and professional presentation mode for conducting fitness classes.

The application serves as an all-in-one solution for fitness professionals to streamline their workflow from planning to execution, offering features like exercise databases, routine builders, calendar integration, and presentation tools for delivering engaging fitness classes.

## User Preferences

Preferred communication style: Simple, everyday language.

## Desired User Workflow
1. **Class-First Organization**: Users should be able to go to Classes page, select a class, then create routines within that class
2. **Calendar Integration**: Users should be able to select dates/times on calendar and add new classes directly from there
3. **Complete Flow**: Classes → Routines → Exercises → Calendar Scheduling

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API architecture with structured route organization
- **Middleware**: Custom logging, error handling, and request processing middleware
- **Development**: Hot module replacement and development tooling integration

### Authentication System
- **Provider**: Email/password authentication with JWT tokens and secure session management
- **Security**: Bcrypt password hashing, JWT tokens, HTTP-only sessions, and PostgreSQL storage
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **User Management**: Professional registration/login system with form validation

### Data Storage
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Schema Design**: Relational design with proper foreign key relationships and indexing

### Core Data Models
- **Users**: Profile management with Replit Auth integration
- **Class Types**: Categorization system for different workout styles
- **Exercises**: Comprehensive exercise database with metadata (difficulty, category, equipment)
- **Routines**: Structured workout plans with exercise sequences
- **Calendar Events**: Scheduling system for fitness classes
- **Routine Exercises**: Junction table for exercise ordering within routines
- **Programs**: Multi-week training program templates with adaptive progression
- **Program Sessions**: Individual training sessions within programs with progression rules
- **Program Enrollments**: Client enrollments in programs with progress tracking
- **Performance Records**: Exercise-specific performance data and RPE feedback
- **Readiness Checks**: Daily client readiness assessments for program adaptation

### Application Features
- **Dashboard**: Analytics and quick access to recent activities ✓ COMPLETED
- **Class Management**: CRUD operations for fitness class types (HIIT, Yoga, etc.) ✓ COMPLETED
- **Exercise Management**: CRUD operations for exercise database with filtering and search ✓ COMPLETED
- **Routine Builder**: Drag-and-drop interface for creating structured workout sequences ✓ COMPLETED
- **Calendar Integration**: Enhanced scheduling with quick time slots, double-click dates, class-routine linking ✓ COMPLETED
- **Presentation Mode**: Full-screen presentation interface for conducting classes ✓ COMPLETED
- **Coach Console**: Event-aware live session management with real-time check-in, timers, and metrics ✓ COMPLETED
- **Client Management**: Complete client profiles, progress tracking, and attendance system ✓ COMPLETED
- **Adaptive Program Builder**: Multi-week training programs with intelligent progression algorithms, RPE-based adjustments, performance tracking, and automatic calendar scheduling ✓ COMPLETED
- **Responsive Design**: Mobile-first approach with cross-device compatibility ✓ COMPLETED

### Current Status & Next Steps
- ✅ **Class Types Management**: Users can create, edit, and delete class types
- ✅ **Default Exercise Creation**: Auto-generates relevant exercises per class type (HIIT, Strength, Yoga, etc.)
- ✅ **Routine Builder Enhancements**: Added "Add New Exercise" functionality within routine builder
- ✅ **Class-to-Routine Workflow**: Complete flow from Classes → Select Class → View/Create Routines
- ✅ **Enhanced Routine List**: Clickable routine list showing name, date, exercise count, and duration
- ✅ **Exercise Database Management**: Full CRUD operations, search and filtering functionality working
- ✅ **Exercise Tab Functionality**: Exercise creation, display, and filtering all operational
- ✅ **Exercise Search & Filter System**: All filters working correctly (category, difficulty, equipment, search)
- ✅ **Calendar Integration Enhanced**: Quick scheduling with double-click dates, time slot buttons, class-routine linking
- ✅ **Presentation Mode Enhanced**: Continuous auto-flow between exercises, simplified clean interface, professional full-screen mode, fixed button visibility issues
- ✅ **Dashboard Analytics Enhanced**: Visual charts (weekly activity, monthly trends, popular exercises, class type distribution), improved layout with prominent schedule placement
- ✅ **Global Search Functionality**: Keyboard shortcuts (Cmd/Ctrl+K), unified search across routines and exercises, smart filtering
- ✅ **Export & Sharing Features**: Professional PDF export with spreadsheet-style layout, shareable routine links, email sharing, clipboard copying
- ✅ **Client Management System**: Complete client profiles, progress tracking, attendance monitoring
- ✅ **Class Enrollment System**: Proper client-to-event enrollment with enrollment management interface
- ✅ **Attendance Tracking**: Shows only enrolled classes, proper client check-in workflow
- ✅ **Event-Aware Coach Console**: Complete live session management system with real-time check-in, exercise timers, performance tracking, session summaries, and seamless Presentation Mode integration
- ✅ **Adaptive Program Builder**: Complete multi-week program system with intelligent progression, RPE-based adjustments, client enrollment, performance tracking, and calendar integration ✓ COMPLETED (Aug 23, 2025)
- ✅ **Dashboard Layout Optimization**: Reorganized based on user feedback - Upcoming Schedule now at top, Quick Actions beside it, stats cards below for trainer-focused workflow ✓ COMPLETED (Aug 23, 2025)
- ✅ **Top 10 Popular Class Types**: Added professional class types (Yoga, Zumba, HIIT, Pilates, CrossFit, Barre, etc.) with detailed descriptions ✓ COMPLETED (Aug 23, 2025)
- ✅ **Complete Exercise Library**: Created 100+ professional exercises (10 per class type) with full metadata, difficulty levels, equipment, modifications, and safety notes ✓ COMPLETED (Aug 23, 2025)
- ✅ **Class-Specific Exercise Filtering**: Routine builder now shows only exercises relevant to selected class type, with clear visual indicators and empty state messages ✓ COMPLETED (Aug 23, 2025)
- 🔄 **Next**: Advanced reporting and analytics features across all program types

### Development Architecture
- **Monorepo Structure**: Shared schema and types between client and server
- **Path Aliases**: Organized imports with TypeScript path mapping
- **Development Tools**: ESBuild for server bundling, TSX for development server
- **Asset Management**: Static asset handling and optimization
- **Environment Configuration**: Separate development and production configurations

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Connection Pooling**: @neondatabase/serverless for optimized database connections

### Authentication & Session Management
- **Replit Auth**: OAuth authentication provider integration
- **OpenID Connect**: Standard authentication protocol implementation
- **Session Storage**: PostgreSQL-backed session persistence

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Component variant management
- **CMDK**: Command palette and search functionality

### Development & Build Tools
- **Vite Plugins**: React support, error overlay, and development enhancements
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TypeScript**: Full-stack type safety and development tooling

### Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **Clsx & Tailwind Merge**: Conditional CSS class management
- **Zod**: Runtime type validation and schema definition
- **Memoizee**: Function memoization for performance optimization

### Server Dependencies
- **Express Session**: Session middleware with PostgreSQL storage
- **Passport**: Authentication middleware integration
- **WebSocket Support**: Real-time communication capabilities via ws library