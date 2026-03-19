-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('session', 'episodic', 'semantic');

CREATE TYPE "MemoryScopeType" AS ENUM ('session', 'task', 'agent', 'project', 'user', 'team');

CREATE TYPE "MemoryStatus" AS ENUM ('active', 'archived', 'invalidated', 'deleted');

CREATE TYPE "MemoryRetentionMode" AS ENUM ('ttl', 'session', 'task', 'persistent');

-- CreateTable
CREATE TABLE "memory_entries" (
    "id" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "scopeType" "MemoryScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "agentId" TEXT,
    "taskId" TEXT,
    "sessionId" TEXT,
    "projectId" TEXT,
    "userId" TEXT,
    "teamId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "tags" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "status" "MemoryStatus" NOT NULL DEFAULT 'active',
    "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memory_links" (
    "id" TEXT NOT NULL,
    "memoryEntryId" TEXT NOT NULL,
    "linkedEntityType" TEXT NOT NULL,
    "linkedEntityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memory_retrieval_records" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT,
    "sessionId" TEXT,
    "memoryEntryId" TEXT NOT NULL,
    "retrievalReason" TEXT NOT NULL,
    "retrievalScore" DOUBLE PRECISION NOT NULL,
    "usedInPromptAssembly" BOOLEAN NOT NULL DEFAULT true,
    "usedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_retrieval_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memory_policies" (
    "id" TEXT NOT NULL,
    "memoryType" "MemoryType" NOT NULL,
    "scopeType" "MemoryScopeType" NOT NULL,
    "retentionMode" "MemoryRetentionMode" NOT NULL,
    "ttlDays" INTEGER,
    "maxEntries" INTEGER,
    "allowAutoPromotion" BOOLEAN NOT NULL DEFAULT false,
    "allowManualPin" BOOLEAN NOT NULL DEFAULT true,
    "allowSemanticExtraction" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_policies_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "memory_entries_type_idx" ON "memory_entries"("type");
CREATE INDEX "memory_entries_scopeType_scopeId_idx" ON "memory_entries"("scopeType", "scopeId");
CREATE INDEX "memory_entries_agentId_idx" ON "memory_entries"("agentId");
CREATE INDEX "memory_entries_taskId_idx" ON "memory_entries"("taskId");
CREATE INDEX "memory_entries_sessionId_idx" ON "memory_entries"("sessionId");
CREATE INDEX "memory_entries_projectId_idx" ON "memory_entries"("projectId");
CREATE INDEX "memory_entries_userId_idx" ON "memory_entries"("userId");
CREATE INDEX "memory_entries_teamId_idx" ON "memory_entries"("teamId");
CREATE INDEX "memory_entries_status_isPinned_idx" ON "memory_entries"("status", "isPinned");

CREATE INDEX "memory_links_memoryEntryId_idx" ON "memory_links"("memoryEntryId");
CREATE INDEX "memory_links_linkedEntityType_linkedEntityId_idx" ON "memory_links"("linkedEntityType", "linkedEntityId");

CREATE INDEX "memory_retrieval_records_taskId_idx" ON "memory_retrieval_records"("taskId");
CREATE INDEX "memory_retrieval_records_agentId_idx" ON "memory_retrieval_records"("agentId");
CREATE INDEX "memory_retrieval_records_sessionId_idx" ON "memory_retrieval_records"("sessionId");
CREATE INDEX "memory_retrieval_records_memoryEntryId_idx" ON "memory_retrieval_records"("memoryEntryId");

CREATE UNIQUE INDEX "memory_policies_memoryType_scopeType_key" ON "memory_policies"("memoryType", "scopeType");

-- Foreign keys
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_memoryEntryId_fkey" FOREIGN KEY ("memoryEntryId") REFERENCES "memory_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memory_retrieval_records" ADD CONSTRAINT "memory_retrieval_records_memoryEntryId_fkey" FOREIGN KEY ("memoryEntryId") REFERENCES "memory_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
