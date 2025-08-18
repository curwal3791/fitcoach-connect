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
- **Provider**: Replit Auth integration for OAuth-based authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Security**: HTTP-only cookies, secure session handling, and CSRF protection
- **User Management**: Automatic user creation and profile management

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

### Application Features
- **Dashboard**: Analytics and quick access to recent activities
- **Class Management**: CRUD operations for fitness class types (HIIT, Yoga, etc.) ✓ COMPLETED
- **Exercise Management**: CRUD operations for exercise database with filtering and search
- **Routine Builder**: Drag-and-drop interface for creating structured workout sequences  
- **Calendar Integration**: Event scheduling and class management with direct class creation
- **Presentation Mode**: Full-screen presentation interface for conducting classes
- **Responsive Design**: Mobile-first approach with cross-device compatibility

### Current Status & Next Steps
- ✅ **Class Types Management**: Users can create, edit, and delete class types
- 🔄 **Next**: Link routine creation to specific classes
- 🔄 **Next**: Enhanced calendar integration for class scheduling
- 🔄 **Next**: Class-specific routine organization and filtering

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