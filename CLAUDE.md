# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 3022
- `npm run build` - Build the application with Next.js
- `npm start` - Start production server on port 3022
- `npm run lint` - Run ESLint

**Testing**: No test framework is currently configured. Check with the user before adding tests.

## Database Management

This project uses Prisma with PostgreSQL:

- **Required**: `DATABASE_URL` environment variable must be set before running any database commands
- Schema: `prisma/schema.prisma` (621 lines with comprehensive domain models)
- Run `npm run db:migrate` to apply schema changes during development
- Run `npm run db:push` to push schema changes without migrations
- Run `npm run db:deploy` to apply migrations in production
- Run `npm run db:reset` to reset database and run seed
- Run `npm run db:seed` to populate with sample data (includes 4 starter AI models)
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
- **UserModel**: User-specific AI model preferences and configurations
- **Team/TeamMember/TeamProject**: Multi-user collaboration
- **Workflow/WorkflowExecution**: Automated generation pipelines  
- **UsageLog/CostTracking**: Analytics and billing
- **ApiKey**: External service authentication
- **Tag/TagCategory/MediaTag/PromptTag**: Enhanced tag system for prompt organization and media categorization

### Application Structure

**Pages** (`src/app/`): Next.js App Router with nested layouts
- Dashboard (`/`) - Project overview and quick actions
- Projects (`/projects/[id]`) - Detailed project management with tabbed interface
- Fields (`/projects/[id]/fields/[fieldId]`) - Field-specific media generation workspace
- Media management, AI model registry, prompt templates
- Tags management system (`/tags/`)
- Analytics and settings pages

**Server Actions** (`src/app/actions/`): 
- `projects.ts` - Project CRUD operations and listing
- `project-detail.ts` - Comprehensive project data fetching with metrics
- `fields.ts` - Field management operations
- `field-detail.ts` - Field-specific data operations
- `generation.ts` - AI generation workflow management
- `media.ts` - Media asset operations
- `models.ts` - AI model management and integration (34KB - comprehensive model handling)
- `userModels.ts` - User-specific model preferences and settings
- `dashboard.ts` - Dashboard data aggregation and analytics
- `schema-analysis.ts` - Database schema analysis utilities
- `tags.ts` - Tag system management

**Components** (`src/components/`):
- `ui/` - Reusable Radix UI components (buttons, cards, forms)
- `projects/` - Project-specific components including detailed tabbed interface
- `fields/` - Field management components with detail workspace
- `tags/` - Tag system components for organization and search
- `layout/` - Header, Footer and layout components

**Database Layer** (`src/lib/db/prisma.ts`):
- Centralized Prisma client with connection management
- Development vs production logging configuration
- Health check utilities and graceful shutdown handling
- Type helpers exported for better TypeScript experience

### Key Design Patterns

**No Modals Philosophy**: All interactions use full-page navigation instead of modal dialogs for better UX and accessibility.

**Dynamic Type System**: Instead of enums, the schema uses string fields (e.g., project `type`, field `type`, media `type`) for maximum flexibility. Types are managed through dedicated tables like `ProjectType`, `FieldType`, `MediaType`.

**Comprehensive Metadata**: JSON fields (`metadata`, `settings`, `requirements`) store flexible configuration without schema changes.

**Multi-tenancy Ready**: Team-based access control with role-based permissions stored as JSON.

**Server Actions Architecture**: All database operations use Server Actions with structured return types:
```typescript
return { success: true, data: result } // or { success: false, error: message }
```

**Singleton Pattern**: Key services like `ModelRegistry` use singleton patterns with caching for performance.

**Database Connection**: Uses a global Prisma client with development logging and connection pooling via `src/lib/db/prisma.ts`.

**Tabbed Navigation**: Complex pages use tabbed interfaces (see `ProjectTabs.tsx`) with consistent icon patterns from Lucide React.

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
- Strict TypeScript configuration with path mapping aliases

**Component Architecture**:
- Tabbed interfaces for complex pages (see `ProjectTabs.tsx`)
- Server Components for data fetching, Client Components for interactivity
- Consistent prop interfaces with clear data flow patterns
- Extensive use of Radix UI primitives for accessibility and consistency

**Error Handling**: 
- Server Actions return structured results with success/error states
- Database operations wrapped in try/catch with meaningful error messages
- Image loading with graceful fallbacks to placeholder icons

**Development Workflow**:
- Follow the tabbed navigation pattern for complex interfaces
- Maintain consistency with existing Server Action patterns
- Leverage the dynamic type system rather than creating new enums
- Always run `npm run lint` after making changes to ensure code quality
- Use TypeScript strict mode - all types are properly defined and exported

The codebase emphasizes developer experience with comprehensive tooling, type safety, and clear separation of concerns between data fetching, business logic, and presentation layers.

## AI Model Integration System

**MediaForge** includes a sophisticated AI model integration system that makes it easy to add and use different AI models from various providers.

### Core Components

**Model Registry** (`src/lib/models/registry/ModelRegistry.ts`):
- Singleton class managing all registered AI models
- Caches model configurations and schemas
- Provides unified interface for model discovery and management

**Replicate Adapter** (`src/lib/models/adapters/ReplicateAdapter.ts`):
- Handles communication with Replicate API
- Supports streaming, webhooks, and batch operations
- Manages authentication and error handling

**Schema Manager** (`src/lib/models/schemas/SchemaManager.ts`):
- Dynamically fetches and parses model schemas from Replicate
- Provides Zod-based validation for type safety
- Transforms inputs for different model requirements

**Dynamic UI Components**:
- `ModelSelector.tsx` - Model selection interface with filtering
- `DynamicModelForm.tsx` - Auto-generated forms based on model schemas

### Available Models (Seeded)

The system comes with 4 starter models across different media types:

1. **FLUX.1 [dev]** - Image generation (Black Forest Labs)
2. **Meta Llama 3.1 8B Instruct** - Text generation (Meta)  
3. **Zeroscope v2 XL** - Video generation (Community)
4. **Incredibly Fast Whisper** - Audio transcription (OpenAI/Community)

### Adding New Models

To add a new model, simply create an entry in the AiModel table:

```typescript
await prisma.aiModel.create({
  data: {
    name: "New Model Name",
    slug: "new-model-slug",
    provider: "replicate",
    type: "image", // or text, video, audio
    config: {
      replicateId: "owner/model-name",
      replicateUrl: "https://replicate.com/owner/model-name",
      version: "latest"
    },
    capabilities: {
      operations: ["text-to-image"],
      mediaTypes: ["image"],
      features: ["seed_control", "batch"],
      streaming: false,
      batch: true,
      webhook: true
    },
    parameters: { /* default parameters */ },
    costPerUse: 0.05,
    status: "active"
  }
})
```

The system will automatically:
- Fetch the model's input/output schema from Replicate
- Generate appropriate form fields in the UI
- Validate inputs according to the schema
- Handle the generation workflow with webhooks

### Integration Points

**Server Actions** (`src/app/actions/models.ts`):
- `getAvailableModels()` - Fetch models with filtering
- `createModelGeneration()` - Start a new generation
- `validateModelInput()` - Validate inputs against schema
- `estimateGenerationCost()` - Calculate generation costs

**API Routes** (`src/app/api/`):
- `/api/models` - CRUD operations for models
- `/api/predictions` - Generation management
- `/api/webhooks/replicate` - Webhook handling

**Database Integration**:
- Extends existing AiModel, Generation, and Media tables
- Maintains compatibility with existing generation workflow
- Adds comprehensive metadata and capability tracking

### Demo Page

Visit `/models/demo` to see the complete system in action with all 4 starter models.