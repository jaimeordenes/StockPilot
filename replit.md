# InventoryPro - Sistema de Inventario y Control de Bodega

## Overview

InventoryPro is a professional inventory and warehouse management system built with modern web technologies. The system provides comprehensive functionality for managing products, warehouses, suppliers, inventory movements, and generating reports. It features a role-based access control system with three user levels: Administrator, Operator, and Viewer. The application is designed to handle multi-warehouse operations with real-time inventory tracking and automated low-stock alerts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod schema validation
- **Build Tool**: Vite with ESBuild for fast development and builds

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Security**: Role-based access control with JWT tokens and bcrypt password hashing

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle migrations with push-based deployment
- **Key Entities**:
  - Users (with role-based permissions)
  - Products (with categories, suppliers, and stock tracking)
  - Warehouses (with capacity and manager assignment)
  - Suppliers (with contact information)
  - Categories (for product organization)
  - Inventory (stock levels per warehouse)
  - Movements (entry, exit, transfer, adjustment tracking)

### Authentication & Authorization
- **Authentication Provider**: Replit Auth with OIDC integration
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Authorization Levels**:
  - Administrator: Full system access
  - Operator: Inventory management operations
  - Viewer: Read-only access
- **Security Features**: Session-based authentication with secure cookie handling

### Data Architecture
- **API Design**: RESTful endpoints with consistent error handling
- **Request/Response**: JSON-based communication with proper HTTP status codes
- **Data Validation**: Zod schemas for both client and server-side validation
- **Real-time Updates**: Query invalidation for reactive UI updates

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon serverless platform
- **Authentication**: Replit Auth OIDC provider
- **Deployment**: Replit hosting environment with custom domain support

### Third-party Libraries
- **UI Framework**: Radix UI component primitives
- **Styling**: Tailwind CSS with PostCSS processing
- **Date Handling**: date-fns for internationalized date formatting
- **Icons**: Lucide React icon library
- **Development Tools**: Vite development server with HMR support

### Build & Development
- **Package Manager**: npm with lockfile for reproducible builds
- **TypeScript**: Strict type checking with path mapping
- **Linting**: ESLint integration for code quality
- **Database Tools**: Drizzle Kit for schema management and migrations