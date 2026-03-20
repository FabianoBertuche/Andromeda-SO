-- AlterTable: sandbox_profiles
ALTER TABLE "sandbox_profiles" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "sandbox_profiles_tenantId_idx" ON "sandbox_profiles"("tenantId");

-- AlterTable: agent_sandbox_configs
ALTER TABLE "agent_sandbox_configs" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "agent_sandbox_configs_tenantId_idx" ON "agent_sandbox_configs"("tenantId");

-- AlterTable: sandbox_executions
ALTER TABLE "sandbox_executions" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "sandbox_executions_tenantId_idx" ON "sandbox_executions"("tenantId");

-- AlterTable: memory_entries
ALTER TABLE "memory_entries" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "memory_entries_tenantId_idx" ON "memory_entries"("tenantId");

-- AlterTable: memory_policies
-- Drop existing unique constraint
ALTER TABLE "memory_policies" DROP CONSTRAINT "memory_policies_memoryType_scopeType_key";
ALTER TABLE "memory_policies" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
-- Create new composite unique constraint with tenantId
CREATE UNIQUE INDEX "memory_policies_tenantId_memoryType_scopeType_key" ON "memory_policies"("tenantId", "memoryType", "scopeType");

-- AlterTable: knowledge_collections
ALTER TABLE "knowledge_collections" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "knowledge_collections_tenantId_idx" ON "knowledge_collections"("tenantId");

-- AlterTable: agent_knowledge_policies
ALTER TABLE "agent_knowledge_policies" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "agent_knowledge_policies_tenantId_idx" ON "agent_knowledge_policies"("tenantId");

-- AlterTable: communication_sessions
ALTER TABLE "communication_sessions" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "communication_sessions_tenantId_idx" ON "communication_sessions"("tenantId");
