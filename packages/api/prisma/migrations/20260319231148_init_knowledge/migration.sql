-- CreateEnum
CREATE TYPE "KnowledgeScopeType" AS ENUM ('agent', 'team', 'project', 'shared');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('upload', 'manual', 'vault');

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'archived');

-- AlterTable
ALTER TABLE "memory_entries" ALTER COLUMN "isPinned" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "importanceScore" DROP DEFAULT;

-- AlterTable
ALTER TABLE "memory_policies" ALTER COLUMN "allowAutoPromotion" DROP DEFAULT,
ALTER COLUMN "allowManualPin" DROP DEFAULT,
ALTER COLUMN "allowSemanticExtraction" DROP DEFAULT;

-- AlterTable
ALTER TABLE "memory_retrieval_records" ALTER COLUMN "usedInPromptAssembly" DROP DEFAULT;

-- CreateTable
CREATE TABLE "knowledge_collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scopeType" "KnowledgeScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "status" "KnowledgeStatus" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "sourcePath" TEXT,
    "mimeType" TEXT,
    "rawText" TEXT,
    "checksum" TEXT,
    "status" "KnowledgeStatus" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenEstimate" INTEGER,
    "embeddingRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retrieval_records" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "sessionId" TEXT,
    "agentId" TEXT,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "selectedChunkIds" TEXT[],
    "selectedDocumentIds" TEXT[],
    "scoreSummary" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retrieval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_knowledge_policies" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "knowledgeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vaultReadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vaultWriteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "writeMode" TEXT NOT NULL DEFAULT 'disabled',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowedCollectionIds" TEXT[],
    "allowedPaths" TEXT[],
    "maxChunks" INTEGER NOT NULL DEFAULT 5,
    "maxContextTokens" INTEGER NOT NULL DEFAULT 2000,
    "rerankEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferMemoryOverKnowledge" BOOLEAN NOT NULL DEFAULT true,
    "preferKnowledgeOverMemory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_knowledge_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_documents_collectionId_idx" ON "knowledge_documents"("collectionId");

-- CreateIndex
CREATE INDEX "knowledge_chunks_documentId_idx" ON "knowledge_chunks"("documentId");

-- CreateIndex
CREATE INDEX "retrieval_records_agentId_idx" ON "retrieval_records"("agentId");

-- CreateIndex
CREATE INDEX "retrieval_records_taskId_idx" ON "retrieval_records"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_knowledge_policies_agentId_key" ON "agent_knowledge_policies"("agentId");

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "knowledge_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
