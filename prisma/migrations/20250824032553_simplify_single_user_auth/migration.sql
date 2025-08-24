-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "githubUrl" TEXT,
    "businessType" TEXT,
    "prdContent" TEXT,
    "schemaContent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" JSONB NOT NULL,
    "modelPreferences" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "project_fields" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "isImageToImage" BOOLEAN NOT NULL DEFAULT false,
    "sourceFieldId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_fields_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_fields_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "project_fields_sourceFieldId_fkey" FOREIGN KEY ("sourceFieldId") REFERENCES "project_fields" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'text-to-image',
    "subcategory" TEXT,
    "tags" TEXT,
    "replicateUrl" TEXT,
    "documentationUrl" TEXT,
    "capabilities" JSONB NOT NULL,
    "costPerImage" REAL NOT NULL,
    "speedRating" INTEGER NOT NULL,
    "qualityRating" INTEGER NOT NULL,
    "maxDimensions" JSONB NOT NULL,
    "supportedFormats" TEXT NOT NULL,
    "defaultSettings" JSONB NOT NULL,
    "configurationSchema" JSONB,
    "examples" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "avgGenerationTime" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "aliases" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "conflictsWith" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fieldId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "modelId" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "estimatedCost" REAL,
    "tokensUsed" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "prompts_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "project_fields" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prompts_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "localPath" TEXT,
    "optimizedPaths" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "cost" REAL NOT NULL,
    "generationTime" INTEGER NOT NULL,
    "rating" INTEGER,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sourceImageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generated_images_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generated_images_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "generation_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "generated_images_sourceImageId_fkey" FOREIGN KEY ("sourceImageId") REFERENCES "generated_images" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "settings" JSONB NOT NULL,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "processingTime" INTEGER,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generation_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompt_tags" (
    "promptId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,

    PRIMARY KEY ("promptId", "tagId"),
    CONSTRAINT "prompt_tags_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prompt_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tag_asset_types" (
    "tagId" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("tagId", "assetTypeId"),
    CONSTRAINT "tag_asset_types_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tag_asset_types_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GenerationSessionToPrompt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GenerationSessionToPrompt_A_fkey" FOREIGN KEY ("A") REFERENCES "generation_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GenerationSessionToPrompt_B_fkey" FOREIGN KEY ("B") REFERENCES "prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "projects_userId_name_key" ON "projects"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_name_key" ON "asset_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_name_key" ON "ai_models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "prompts_fieldId_version_key" ON "prompts"("fieldId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "_GenerationSessionToPrompt_AB_unique" ON "_GenerationSessionToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_GenerationSessionToPrompt_B_index" ON "_GenerationSessionToPrompt"("B");
