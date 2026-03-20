import { PrismaClient } from "@prisma/client";
import { IAgentKnowledgePolicyRepository } from "../../../../../core/src/domain/knowledge/IAgentKnowledgePolicyRepository";
import { AgentKnowledgePolicy } from "../../../../../core/src/domain/knowledge/types";

export class PrismaAgentKnowledgePolicyRepository implements IAgentKnowledgePolicyRepository {
    constructor(private prisma: PrismaClient) { }

    async getPolicyByAgent(agentId: string): Promise<AgentKnowledgePolicy | null> {
        const policy = await this.prisma.agentKnowledgePolicy.findUnique({
            where: { agentId },
        });
        return policy ? this.mapToPolicy(policy) : null;
    }

    async upsertPolicy(agentId: string, data: Partial<AgentKnowledgePolicy>): Promise<AgentKnowledgePolicy> {
        const policy = await this.prisma.agentKnowledgePolicy.upsert({
            where: { agentId },
            update: {
                knowledgeEnabled: data.knowledgeEnabled,
                vaultReadEnabled: data.vaultReadEnabled,
                vaultWriteEnabled: data.vaultWriteEnabled,
                writeMode: data.writeMode,
                approvalRequired: data.approvalRequired,
                allowedCollectionIds: data.allowedCollectionIds,
                allowedPaths: data.allowedPaths,
                maxChunks: data.maxChunks,
                maxContextTokens: data.maxContextTokens,
                rerankEnabled: data.rerankEnabled,
                preferMemoryOverKnowledge: data.preferMemoryOverKnowledge,
                preferKnowledgeOverMemory: data.preferKnowledgeOverMemory,
            },
            create: {
                agentId,
                knowledgeEnabled: data.knowledgeEnabled ?? false,
                vaultReadEnabled: data.vaultReadEnabled ?? false,
                vaultWriteEnabled: data.vaultWriteEnabled ?? false,
                writeMode: data.writeMode ?? 'disabled',
                approvalRequired: data.approvalRequired ?? true,
                allowedCollectionIds: data.allowedCollectionIds ?? [],
                allowedPaths: data.allowedPaths ?? [],
                maxChunks: data.maxChunks ?? 5,
                maxContextTokens: data.maxContextTokens ?? 2000,
                rerankEnabled: data.rerankEnabled ?? false,
                preferMemoryOverKnowledge: data.preferMemoryOverKnowledge ?? true,
                preferKnowledgeOverMemory: data.preferKnowledgeOverMemory ?? false,
            },
        });
        return this.mapToPolicy(policy);
    }

    async deletePolicy(agentId: string): Promise<void> {
        await this.prisma.agentKnowledgePolicy.delete({
            where: { agentId },
        });
    }

    private mapToPolicy(p: any): AgentKnowledgePolicy {
        return {
            id: p.id,
            agentId: p.agentId,
            knowledgeEnabled: p.knowledgeEnabled,
            vaultReadEnabled: p.vaultReadEnabled,
            vaultWriteEnabled: p.vaultWriteEnabled,
            writeMode: p.writeMode as any,
            approvalRequired: p.approvalRequired,
            allowedCollectionIds: p.allowedCollectionIds,
            allowedPaths: p.allowedPaths,
            maxChunks: p.maxChunks,
            maxContextTokens: p.maxContextTokens,
            rerankEnabled: p.rerankEnabled,
            preferMemoryOverKnowledge: p.preferMemoryOverKnowledge,
            preferKnowledgeOverMemory: p.preferKnowledgeOverMemory,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
}
