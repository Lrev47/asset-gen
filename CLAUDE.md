# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (runs on port 3022 by default)
- `npm run build` - Build the application with Next.js
- `npm start` - Start production server on port 3022
- `npm run lint` - Run ESLint

## Database Management

This project uses Prisma with PostgreSQL:

- Database URL configured via `DATABASE_URL` environment variable
- Schema: `prisma/schema.prisma`
- Run `npm run db:migrate` to apply schema changes during development
- Run `npm run db:push` to push schema changes without migrations
- Run `npm run db:deploy` to apply migrations in production
- Run `npm run db:reset` to reset database and run seed
- Run `npm run db:seed` to populate with sample data
- Run `npm run db:studio` to launch Prisma Studio GUI
- Run `npm run generate` to regenerate Prisma client after schema changes

The schema includes generators for DBML and JSON Schema documentation in `prisma/generated/`.

## Architecture Overview

**MediaForge** is a Next.js 15 application for AI-powered media generation and project management.

### Core Domain Models (see `prisma/schema.prisma`)

**Primary Entities:**
- **User**: Platform users with preferences and API keys
- **Project**: Top-level containers for organizing work (websites, marketing campaigns)
- **Field**: Specific media requirements within projects (hero banners, galleries, etc.)
- **Media**: Generated or uploaded assets with versioning support
- **AiModel**: Registry of available AI models (OpenAI, Replicate, local models)
- **Generation**: AI generation jobs with status tracking and cost data
- **Prompt**: Reusable prompts with templates and JSON structure

**Supporting Models:**
- **Team/TeamMember/TeamProject**: Multi-user collaboration
- **Workflow/WorkflowExecution**: Automated generation pipelines  
- **UsageLog/CostTracking**: Analytics and billing
- **ApiKey**: External service authentication

### Application Structure

**Pages** (`src/app/`): Next.js App Router with nested layouts
- Dashboard (`/`) - Project overview and quick actions
- Projects (`/projects/[id]`) - Detailed project management with tabbed interface
- Media management, AI model registry, prompt templates
- Analytics and settings pages

**Server Actions** (`src/app/actions/`): 
- `projects.ts` - Project CRUD operations and listing
- `project-detail.ts` - Comprehensive project data fetching with metrics

**Components** (`src/components/`):
- `ui/` - Reusable Radix UI components (buttons, cards, forms)
- `projects/` - Project-specific components including detailed tabbed interface
- `PlaceholderPage.tsx` - Development template for unimplemented pages

**Database Layer** (`src/lib/db/prisma.ts`):
- Centralized Prisma client with connection management
- Development vs production logging configuration
- Health check utilities and graceful shutdown handling

### Key Design Patterns

**No Modals Philosophy**: All interactions use full-page navigation instead of modal dialogs for better UX and accessibility.

**Dynamic Type System**: Instead of enums, the schema uses string fields (e.g., project `type`, field `type`, media `type`) for maximum flexibility. Types are managed through dedicated tables like `ProjectType`, `FieldType`, `MediaType`.

**Comprehensive Metadata**: JSON fields (`metadata`, `settings`, `requirements`) store flexible configuration without schema changes.

**Multi-tenancy Ready**: Team-based access control with role-based permissions stored as JSON.

## Integration Points

**Database**: PostgreSQL via Prisma ORM with automatic client generation
**Styling**: TailwindCSS with custom design system and dark mode support
**UI Library**: Radix UI primitives with custom theming
**Icons**: Lucide React for consistent iconography  
**AI Services**: OpenAI and Replicate API integrations (implementation pending)
**Image Processing**: Sharp for optimization and manipulation
**State Management**: Server Actions + React 19 features, Zustand for client state

## Project-Specific Conventions

**Server Actions**: All database operations use Server Actions rather than API routes for type safety and performance.

**File Organization**: 
- Server Actions in `src/app/actions/`
- Page components follow Next.js App Router conventions
- Reusable components in `src/components/` with domain-specific folders
- Database utilities in `src/lib/db/`

**Type Safety**: 
- Prisma-generated types exported from `src/lib/db/prisma.ts`
- Server Action return types defined alongside functions
- Strict TypeScript configuration

**Component Architecture**:
- Tabbed interfaces for complex pages (see `ProjectTabs.tsx`)
- Server Components for data fetching, Client Components for interactivity
- Consistent prop interfaces with clear data flow patterns

**Error Handling**: 
- Server Actions return structured results with success/error states
- Database operations wrapped in try/catch with meaningful error messages
- Image loading with graceful fallbacks to placeholder icons

The codebase emphasizes developer experience with comprehensive tooling, type safety, and clear separation of concerns between data fetching, business logic, and presentation layers.