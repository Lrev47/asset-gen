# Prisma Generators & Client Setup

This document outlines the Prisma generators and client configuration for the MediaForge project.

## Generated Files Structure

When you run `npx prisma generate`, the following files will be created in `prisma/generated/`:

```
prisma/
├── schema.prisma
└── generated/
    ├── zod/                    # Zod validation schemas
    │   ├── index.ts           # Barrel file exports
    │   ├── inputTypeSchemas/  # Input validation schemas
    │   ├── modelSchema/       # Model validation schemas
    │   └── outputTypeSchemas/ # Output validation schemas
    │
    ├── erd/                   # Entity Relationship Diagrams
    │   └── schema.svg         # Visual ERD diagram
    │
    ├── dbml/                  # Database Markup Language
    │   └── schema.dbml        # Database schema in DBML format
    │
    └── json/                  # JSON Schema
        ├── json-schema.json   # Complete JSON schema
        └── definitions/       # Individual model schemas
```

## Prisma Client

### Location
- `lib/prismaClient.ts` - Centralized Prisma client with optimizations

### Features
- **Singleton Pattern**: Prevents connection exhaustion in development
- **Environment-aware Logging**: Detailed logs in dev, errors only in prod
- **Type Exports**: All Prisma types exported for easy importing
- **Utilities**: Connection, health check, and transaction helpers

### Usage Examples

```typescript
// Basic usage
import { prisma } from '@/lib/prismaClient'

const users = await prisma.user.findMany()

// With types
import { prisma, User, Project } from '@/lib/prismaClient'

const user: User = await prisma.user.findUnique({
  where: { id: 'user-id' }
})

// Health check
import { healthCheck } from '@/lib/prismaClient'

const health = await healthCheck()
console.log(health.status) // 'healthy' | 'unhealthy'

// Transaction
import { transaction } from '@/lib/prismaClient'

await transaction([
  prisma.project.create({ data: projectData }),
  prisma.field.create({ data: fieldData })
])
```

## Generators Configuration

### 1. Zod Generator (`zod-prisma-types`)
- **Output**: `prisma/generated/zod/`
- **Purpose**: Type-safe validation schemas
- **Features**:
  - Input validation for forms
  - API request/response validation
  - Optional/default value handling
  - Relation validation

**Usage:**
```typescript
import { UserCreateInputSchema } from '@/prisma/generated/zod'

const validateUser = UserCreateInputSchema.parse(userData)
```

### 2. ERD Generator (`prisma-erd-generator`)
- **Output**: `prisma/generated/erd/schema.svg`
- **Purpose**: Visual database schema
- **Usage**: Open SVG file to view entity relationships

### 3. DBML Generator (`prisma-dbml-generator`)
- **Output**: `prisma/generated/dbml/schema.dbml`
- **Purpose**: Database documentation in DBML format
- **Usage**: Import into dbdiagram.io or other DBML tools

### 4. JSON Schema Generator (`prisma-json-schema-generator`)
- **Output**: `prisma/generated/json/`
- **Purpose**: OpenAPI/JSON Schema for API documentation
- **Usage**: Import into Swagger/OpenAPI tools

## Commands

### Install Dependencies
```bash
npm install
```

### Generate All Schemas
```bash
npx prisma generate
# or
npm run generate
```

### Push Schema to Database
```bash
npx prisma db push
# or  
npm run db:push
```

### View Database in Studio
```bash
npx prisma studio
# or
npm run db:studio
```

### Reset Database
```bash
npx prisma migrate reset
# or
npm run db:reset
```

## Development Workflow

1. **Modify Schema**: Edit `schema.prisma`
2. **Generate Types**: Run `npx prisma generate`
3. **Push to DB**: Run `npx prisma db push`
4. **Use Generated Files**: Import Zod schemas, view ERD, etc.

## File Imports

### Prisma Client
```typescript
// Recommended: Use centralized client
import { prisma } from '@/lib/prismaClient'

// With types
import { prisma, User, Project, Prisma } from '@/lib/prismaClient'
```

### Zod Schemas
```typescript
// Model schemas (for validation)
import { 
  UserSchema, 
  ProjectSchema 
} from '@/prisma/generated/zod'

// Input schemas (for forms)
import { 
  UserCreateInputSchema,
  ProjectUpdateInputSchema 
} from '@/prisma/generated/zod'
```

### JSON Schemas
```typescript
// For API documentation
import jsonSchema from '@/prisma/generated/json/json-schema.json'
```

## Notes

- Generated files are in `.gitignore` - they're regenerated on build
- Run `npx prisma generate` after any schema changes
- ERD diagram helps visualize complex relationships
- Zod schemas provide runtime type safety
- JSON schemas enable automatic API documentation