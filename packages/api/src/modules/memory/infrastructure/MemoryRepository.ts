import { PrismaClient, Prisma } from "@prisma/client";
import {
    MemoryEntry,
    MemoryListFilters,
    MemoryLink,
    MemoryPolicy,
    MemoryRetrievalRecord,
    MemoryStatus,
} from "../domain/memory";

function jsonArray(value: Prisma.JsonValue | null | undefined): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item): item is string => typeof item === "string");
}

function jsonObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toMemoryEntry(record: any): MemoryEntry {
    return {
        id: record.id,
        type: record.type,
        scopeType: record.scopeType,
        scopeId: record.scopeId,
        agentId: record.agentId,
        taskId: record.taskId,
        sessionId: record.sessionId,
        projectId: record.projectId,
        userId: record.userId,
        teamId: record.teamId,
        title: record.title,
        content: record.content,
        summary: record.summary,
        tags: jsonArray(record.tags),
        source: record.source,
        sourceEventId: record.sourceEventId,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
        isPinned: record.isPinned,
        status: record.status,
        importanceScore: Number(record.importanceScore),
        metadata: jsonObject(record.metadata),
    };
}

function toMemoryPolicy(record: any): MemoryPolicy {
    return {
        id: record.id,
        memoryType: record.memoryType,
        scopeType: record.scopeType,
        retentionMode: record.retentionMode,
        ttlDays: record.ttlDays,
        maxEntries: record.maxEntries,
        allowAutoPromotion: record.allowAutoPromotion,
        allowManualPin: record.allowManualPin,
        allowSemanticExtraction: record.allowSemanticExtraction,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
    };
}

function toMemoryLink(record: any): MemoryLink {
    return {
        id: record.id,
        memoryEntryId: record.memoryEntryId,
        linkedEntityType: record.linkedEntityType,
        linkedEntityId: record.linkedEntityId,
        relationType: record.relationType,
        createdAt: new Date(record.createdAt),
    };
}

function toMemoryUsage(record: any): MemoryRetrievalRecord {
    return {
        id: record.id,
        taskId: record.taskId,
        agentId: record.agentId,
        sessionId: record.sessionId,
        memoryEntryId: record.memoryEntryId,
        retrievalReason: record.retrievalReason,
        retrievalScore: Number(record.retrievalScore),
        usedInPromptAssembly: record.usedInPromptAssembly,
        usedAt: new Date(record.usedAt),
        createdAt: new Date(record.createdAt),
    };
}

function applyStatusFilter(status?: MemoryStatus) {
    if (!status) {
        return undefined;
    }
    return status;
}

export interface MemoryRepositoryBundle {
    listEntries(filters?: MemoryListFilters): Promise<MemoryEntry[]>;
    getEntry(id: string): Promise<MemoryEntry | null>;
    createEntry(entry: MemoryEntry): Promise<MemoryEntry>;
    updateEntry(id: string, patch: Partial<MemoryEntry>): Promise<MemoryEntry>;
    deleteEntry(id: string): Promise<void>;
    listLinks(memoryEntryId: string): Promise<MemoryLink[]>;
    createLink(link: MemoryLink): Promise<MemoryLink>;
    listUsage(memoryEntryId: string): Promise<MemoryRetrievalRecord[]>;
    createUsage(record: MemoryRetrievalRecord): Promise<MemoryRetrievalRecord>;
    listPolicies(): Promise<MemoryPolicy[]>;
    getPolicy(id: string): Promise<MemoryPolicy | null>;
    upsertPolicy(policy: MemoryPolicy): Promise<MemoryPolicy>;
    findPolicy(memoryType: MemoryPolicy["memoryType"], scopeType: MemoryPolicy["scopeType"]): Promise<MemoryPolicy | null>;
}

export class PrismaMemoryRepositoryBundle implements MemoryRepositoryBundle {
    constructor(private readonly prisma: PrismaClient) { }

    async listEntries(filters: MemoryListFilters = {}): Promise<MemoryEntry[]> {
        const entries = await this.prisma.memoryEntry.findMany({
            where: {
                type: filters.type,
                scopeType: filters.scopeType,
                agentId: filters.agentId,
                sessionId: filters.sessionId,
                taskId: filters.taskId,
                projectId: filters.projectId,
                userId: filters.userId,
                teamId: filters.teamId,
                status: applyStatusFilter(filters.status),
                isPinned: filters.pinnedOnly ? true : undefined,
            },
            orderBy: [
                { isPinned: "desc" },
                { importanceScore: "desc" },
                { updatedAt: "desc" },
            ],
            take: filters.q ? undefined : filters.limit,
        });

        const mapped = entries.map(toMemoryEntry).filter((entry) => this.matchesQuery(entry, filters.q));
        return mapped.slice(0, filters.limit || Number.MAX_SAFE_INTEGER);
    }

    async getEntry(id: string): Promise<MemoryEntry | null> {
        const record = await this.prisma.memoryEntry.findUnique({ where: { id } });
        return record ? toMemoryEntry(record) : null;
    }

    async createEntry(entry: MemoryEntry): Promise<MemoryEntry> {
        const record = await this.prisma.memoryEntry.create({
            data: {
                ...entry,
                tags: entry.tags as Prisma.InputJsonValue,
                metadata: entry.metadata as Prisma.InputJsonValue,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                expiresAt: entry.expiresAt || undefined,
            },
        });
        return toMemoryEntry(record);
    }

    async updateEntry(id: string, patch: Partial<MemoryEntry>): Promise<MemoryEntry> {
        const record = await this.prisma.memoryEntry.update({
            where: { id },
            data: {
                ...patch,
                tags: patch.tags ? patch.tags as Prisma.InputJsonValue : undefined,
                metadata: patch.metadata ? patch.metadata as Prisma.InputJsonValue : undefined,
                updatedAt: patch.updatedAt || new Date(),
                expiresAt: patch.expiresAt === undefined ? undefined : patch.expiresAt || null,
            },
        });
        return toMemoryEntry(record);
    }

    async deleteEntry(id: string): Promise<void> {
        await this.prisma.memoryEntry.delete({ where: { id } });
    }

    async listLinks(memoryEntryId: string): Promise<MemoryLink[]> {
        const links = await this.prisma.memoryLink.findMany({ where: { memoryEntryId }, orderBy: { createdAt: "desc" } });
        return links.map(toMemoryLink);
    }

    async createLink(link: MemoryLink): Promise<MemoryLink> {
        const record = await this.prisma.memoryLink.create({
            data: {
                ...link,
                createdAt: link.createdAt,
            },
        });
        return toMemoryLink(record);
    }

    async listUsage(memoryEntryId: string): Promise<MemoryRetrievalRecord[]> {
        const records = await this.prisma.memoryRetrievalRecord.findMany({ where: { memoryEntryId }, orderBy: { usedAt: "desc" } });
        return records.map(toMemoryUsage);
    }

    async createUsage(record: MemoryRetrievalRecord): Promise<MemoryRetrievalRecord> {
        const created = await this.prisma.memoryRetrievalRecord.create({
            data: {
                ...record,
                usedAt: record.usedAt,
                createdAt: record.createdAt,
            },
        });
        return toMemoryUsage(created);
    }

    async listPolicies(): Promise<MemoryPolicy[]> {
        const policies = await this.prisma.memoryPolicy.findMany({ orderBy: [{ memoryType: "asc" }, { scopeType: "asc" }] });
        return policies.map(toMemoryPolicy);
    }

    async getPolicy(id: string): Promise<MemoryPolicy | null> {
        const policy = await this.prisma.memoryPolicy.findUnique({ where: { id } });
        return policy ? toMemoryPolicy(policy) : null;
    }

    async upsertPolicy(policy: MemoryPolicy): Promise<MemoryPolicy> {
        const record = await this.prisma.memoryPolicy.upsert({
            where: { id: policy.id },
            create: {
                ...policy,
                createdAt: policy.createdAt,
                updatedAt: policy.updatedAt,
            },
            update: {
                ...policy,
                updatedAt: policy.updatedAt,
            },
        });
        return toMemoryPolicy(record);
    }

    async findPolicy(memoryType: MemoryPolicy["memoryType"], scopeType: MemoryPolicy["scopeType"]): Promise<MemoryPolicy | null> {
        const policy = await this.prisma.memoryPolicy.findUnique({
            where: {
                memoryType_scopeType: { memoryType, scopeType },
            },
        });
        return policy ? toMemoryPolicy(policy) : null;
    }

    private matchesQuery(entry: MemoryEntry, query?: string): boolean {
        const normalized = query?.trim().toLowerCase();
        if (!normalized) {
            return true;
        }

        const haystack = [
            entry.id,
            entry.type,
            entry.scopeType,
            entry.scopeId,
            entry.title,
            entry.content,
            entry.summary || "",
            entry.source,
            ...(entry.tags || []),
            JSON.stringify(entry.metadata || {}),
        ].join(" ").toLowerCase();

        return haystack.includes(normalized);
    }
}
