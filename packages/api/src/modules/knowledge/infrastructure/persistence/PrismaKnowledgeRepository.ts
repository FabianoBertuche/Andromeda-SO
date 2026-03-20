import { PrismaClient } from "@prisma/client";
import { IKnowledgeRepository } from "../../../../../core/src/domain/knowledge/IKnowledgeRepository";
import {
    KnowledgeCollection,
    KnowledgeDocument,
    KnowledgeChunk,
    KnowledgeScopeType,
    KnowledgeSourceType,
    KnowledgeStatus
} from "../../../../../core/src/domain/knowledge/types";

export class PrismaKnowledgeRepository implements IKnowledgeRepository {
    constructor(private prisma: PrismaClient) { }

    // Collections
    async createCollection(data: Partial<KnowledgeCollection>): Promise<KnowledgeCollection> {
        const collection = await this.prisma.knowledgeCollection.create({
            data: {
                name: data.name!,
                description: data.description,
                scopeType: data.scopeType as any,
                scopeId: data.scopeId!,
                sourceType: data.sourceType as any,
                status: data.status as any,
                metadata: data.metadata || {},
            },
        });
        return this.mapToCollection(collection);
    }

    async getCollection(id: string): Promise<KnowledgeCollection | null> {
        const collection = await this.prisma.knowledgeCollection.findUnique({
            where: { id },
        });
        return collection ? this.mapToCollection(collection) : null;
    }

    async listCollections(filters: { scopeType?: KnowledgeScopeType, scopeId?: string }): Promise<KnowledgeCollection[]> {
        const collections = await this.prisma.knowledgeCollection.findMany({
            where: {
                scopeType: filters.scopeType as any,
                scopeId: filters.scopeId,
            },
        });
        return collections.map(c => this.mapToCollection(c));
    }

    async updateCollection(id: string, data: Partial<KnowledgeCollection>): Promise<KnowledgeCollection> {
        const collection = await this.prisma.knowledgeCollection.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                status: data.status as any,
                metadata: data.metadata,
            },
        });
        return this.mapToCollection(collection);
    }

    async deleteCollection(id: string): Promise<void> {
        await this.prisma.knowledgeCollection.delete({
            where: { id },
        });
    }

    // Documents
    async addDocument(collectionId: string, data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
        const document = await this.prisma.knowledgeDocument.create({
            data: {
                collectionId,
                title: data.title!,
                sourceType: data.sourceType as any,
                sourcePath: data.sourcePath,
                mimeType: data.mimeType,
                rawText: data.rawText,
                checksum: data.checksum,
                status: data.status as any,
                metadata: data.metadata || {},
            },
        });
        return this.mapToDocument(document);
    }

    async getDocument(id: string): Promise<KnowledgeDocument | null> {
        const document = await this.prisma.knowledgeDocument.findUnique({
            where: { id },
        });
        return document ? this.mapToDocument(document) : null;
    }

    async listDocuments(collectionId: string): Promise<KnowledgeDocument[]> {
        const documents = await this.prisma.knowledgeDocument.findMany({
            where: { collectionId },
        });
        return documents.map(d => this.mapToDocument(d));
    }

    async updateDocument(id: string, data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
        const document = await this.prisma.knowledgeDocument.update({
            where: { id },
            data: {
                title: data.title,
                status: data.status as any,
                metadata: data.metadata,
            },
        });
        return this.mapToDocument(document);
    }

    async deleteDocument(id: string): Promise<void> {
        await this.prisma.knowledgeDocument.delete({
            where: { id },
        });
    }

    // Chunks
    async storeChunks(documentId: string, chunks: Partial<KnowledgeChunk>[]): Promise<KnowledgeChunk[]> {
        const createdChunks = await Promise.all(
            chunks.map(chunk =>
                this.prisma.knowledgeChunk.create({
                    data: {
                        documentId,
                        ordinal: chunk.ordinal!,
                        content: chunk.content!,
                        tokenEstimate: chunk.tokenEstimate,
                        embeddingRef: chunk.embeddingRef,
                        metadata: chunk.metadata || {},
                    }
                })
            )
        );
        return createdChunks.map(c => this.mapToChunk(c));
    }

    async getChunks(documentId: string): Promise<KnowledgeChunk[]> {
        const chunks = await this.prisma.knowledgeChunk.findMany({
            where: { documentId },
            orderBy: { ordinal: 'asc' },
        });
        return chunks.map(c => this.mapToChunk(c));
    }

    async deleteChunks(documentId: string): Promise<void> {
        await this.prisma.knowledgeChunk.deleteMany({
            where: { documentId },
        });
    }

    async searchDocuments(query: string, filters: any): Promise<KnowledgeDocument[]> {
        // Simplified metadata/title search before vector search
        const documents = await this.prisma.knowledgeDocument.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { rawText: { contains: query, mode: 'insensitive' } },
                ],
                ...filters,
            },
        });
        return documents.map(d => this.mapToDocument(d));
    }

    // Mappers
    private mapToCollection(p: any): KnowledgeCollection {
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            scopeType: p.scopeType as KnowledgeScopeType,
            scopeId: p.scopeId,
            sourceType: p.sourceType as KnowledgeSourceType,
            status: p.status as KnowledgeStatus,
            metadata: p.metadata as Record<string, any>,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }

    private mapToDocument(p: any): KnowledgeDocument {
        return {
            id: p.id,
            collectionId: p.collectionId,
            title: p.title,
            sourceType: p.sourceType as KnowledgeSourceType,
            sourcePath: p.sourcePath,
            mimeType: p.mimeType,
            rawText: p.rawText,
            checksum: p.checksum,
            status: p.status as KnowledgeStatus,
            metadata: p.metadata as Record<string, any>,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }

    private mapToChunk(p: any): KnowledgeChunk {
        return {
            id: p.id,
            documentId: p.documentId,
            ordinal: p.ordinal,
            content: p.content,
            tokenEstimate: p.tokenEstimate,
            embeddingRef: p.embeddingRef,
            metadata: p.metadata as Record<string, any>,
            createdAt: p.createdAt,
        };
    }
}
