-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('web', 'telegram', 'discord', 'cli', 'mobile', 'system');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('text', 'json', 'event', 'command');

-- CreateEnum
CREATE TYPE "CommunicationSessionStatus" AS ENUM ('active', 'idle', 'closed');

-- CreateTable
CREATE TABLE "communication_sessions" (
    "id" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "externalSessionId" TEXT,
    "internalUserId" TEXT,
    "externalUserId" TEXT,
    "status" "CommunicationSessionStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "context" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "communication_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" JSONB NOT NULL,
    "sender" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_messages_sessionId_idx" ON "communication_messages"("sessionId");

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "communication_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
