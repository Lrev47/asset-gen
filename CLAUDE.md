# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application with Turbopack  
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Database Management

This project uses Prisma with SQLite:

- Database file: `prisma/dev.db`
- Schema: `prisma/schema.prisma`
- Run `npx prisma migrate dev` to apply schema changes
- Run `npx prisma generate` to update the Prisma client
- Run `npx prisma studio` to view/edit database contents

## Architecture Overview

### Core Application Structure

**Asset Generator Studio** is a Next.js 15 application for AI-powered image generation organized around projects and asset types.

#### Key Domain Models (see `prisma/schema.prisma`):

- **Project**: Top-level container for a website/app project
- **AssetType**: Categories like "Gallery", "Hero Banner", "Profile Images" 
- **ProjectField**: Specific image requirements within a project
- **AIModel**: Registry of available AI models (OpenAI DALL-E, Replicate models)
- **Prompt**: Generated prompts for specific fields with model assignments
- **GeneratedImage**: Results from AI generation with metadata and user feedback
- **GenerationSession**: Tracks batch operations and costs
- **Tag**: Searchable attributes for prompts and asset types

#### Application Layers:

1. **Pages** (`src/app/`): Next.js App Router pages
   - Dashboard (`/`) - Project overview
   - Individual project view (`/project/[id]`) 
   - Asset types, models, tags management pages

2. **API Routes** (`src/app/api/`): Server-side logic
   - Project CRUD operations
   - AI model integration (OpenAI, Replicate)
   - Batch processing endpoints
   - Data initialization and seeding

3. **UI Components** (`src/ui/`): Reusable React components
   - `Dashboard`, `ProjectManager`, `SettingsPanel`
   - `BatchProcessor`, `ImagePreview`

4. **Business Logic** (`src/`):
   - **Analyzers**: Extract requirements from PRDs and schemas
   - **Generators**: AI service integrations (OpenAI DALL-E, Replicate models)
   - **Managers**: Business logic for naming conventions, prompts
   - **Processors**: Image handling and optimization
   - **Services**: Core business services for asset types, projects, tags

#### AI Integration:

- **OpenAI**: DALL-E 3 via `src/generators/openai/dalle.ts`
- **Replicate**: Multiple models via `src/generators/replicate/`
- **Prompt Enhancement**: OpenAI GPT for prompt optimization
- **Image-to-Image**: Support for using generated images as source material

#### Data Flow:

1. User creates project with description and type
2. System analyzes requirements and suggests asset types
3. User defines project fields (specific image needs)  
4. System generates optimized prompts using templates and tags
5. AI models generate images based on prompts
6. Users review, rate, and select images
7. Export functionality provides organized assets

## Key Integration Points

- **Database**: Prisma ORM with SQLite database
- **Styling**: TailwindCSS with Radix UI components
- **Icons**: Heroicons and Lucide React
- **AI Services**: OpenAI API and Replicate API
- **Image Processing**: Sharp for optimization
- **Authentication**: Next-Auth setup (currently unused)

## Important File Locations

- Main schema: `prisma/schema.prisma`  
- Core business logic: `src/services/`, `src/managers/`
- AI integrations: `src/generators/`
- Component library: `src/ui/`, `src/components/`
- Type definitions: Inferred from Prisma schema