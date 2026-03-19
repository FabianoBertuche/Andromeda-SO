-- Create enums
CREATE TYPE "SandboxMode" AS ENUM ('none', 'process', 'container', 'remote');
CREATE TYPE "RiskLevel" AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE "SandboxExecutionStatus" AS ENUM (
    'queued',
    'awaiting_approval',
    'provisioning',
    'running',
    'completed',
    'failed',
    'timed_out',
    'blocked_by_policy',
    'cancelled'
);
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- Sandbox profiles
CREATE TABLE "sandbox_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL,
    "mode" "SandboxMode" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sandbox_profiles_pkey" PRIMARY KEY ("id")
);

-- Agent sandbox configs
CREATE TABLE "agent_sandbox_configs" (
    "agentId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "profileId" TEXT,
    "overrides" JSONB NOT NULL,
    "enforcement" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agent_sandbox_configs_pkey" PRIMARY KEY ("agentId")
);

-- Sandbox executions
CREATE TABLE "sandbox_executions" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "taskId" TEXT,
    "skillId" TEXT,
    "capability" TEXT NOT NULL,
    "status" "SandboxExecutionStatus" NOT NULL,
    "mode" "SandboxMode" NOT NULL,
    "command" JSONB NOT NULL,
    "policySnapshot" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "exitCode" INTEGER,
    "resourceUsage" JSONB,
    "errorMessage" TEXT,
    "stdout" TEXT,
    "stderr" TEXT,
    CONSTRAINT "sandbox_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sandbox_executions_agentId_idx" ON "sandbox_executions" ("agentId");
CREATE INDEX "sandbox_executions_taskId_idx" ON "sandbox_executions" ("taskId");

-- Sandbox artifacts
CREATE TABLE "sandbox_artifacts" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "mimeType" TEXT,
    "retainedUntil" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "sandbox_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sandbox_artifacts_executionId_idx" ON "sandbox_artifacts" ("executionId");

-- Approval requests
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "taskId" TEXT,
    "executionId" TEXT,
    "reason" TEXT NOT NULL,
    "requestedAction" JSONB NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "approval_requests_agentId_idx" ON "approval_requests" ("agentId");
CREATE INDEX "approval_requests_taskId_idx" ON "approval_requests" ("taskId");
CREATE INDEX "approval_requests_executionId_idx" ON "approval_requests" ("executionId");

-- Foreign keys
ALTER TABLE "agent_sandbox_configs"
    ADD CONSTRAINT "agent_sandbox_configs_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "sandbox_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sandbox_artifacts"
    ADD CONSTRAINT "sandbox_artifacts_executionId_fkey"
    FOREIGN KEY ("executionId") REFERENCES "sandbox_executions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "approval_requests"
    ADD CONSTRAINT "approval_requests_executionId_fkey"
    FOREIGN KEY ("executionId") REFERENCES "sandbox_executions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
