import { KnowledgeCollection, KnowledgeDocument, KnowledgeChunk, KnowledgeScopeType } from "./types";

export interface IKnowledgeRepository {
    // Collections
    createCollection(data: Partial<KnowledgeCollection>): Promise<KnowledgeCollection>;
    getCollection(id: string): Promise<KnowledgeCollection | null>;
    listCollections(filters: { scopeType?: KnowledgeScopeType, scopeId?: string }): Promise<KnowledgeCollection[]>;
    updateCollection(id: string, data: Partial<KnowledgeCollection>): Promise<KnowledgeCollection>;
    deleteCollection(id: string): Promise<void>;

    // Documents
    addDocument(collectionId: string, data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument>;
    getDocument(id: string): Promise<KnowledgeDocument | null>;
    listDocuments(collectionId: string): Promise<KnowledgeDocument[]>;
    updateDocument(id: string, data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument>;
    deleteDocument(id: string): Promise<void>;

    // Chunks
    storeChunks(documentId: string, chunks: Partial<KnowledgeChunk>[]): Promise<KnowledgeChunk[]>;
    getChunks(documentId: string): Promise<KnowledgeChunk[]>;
    deleteChunks(documentId: string): Promise<void>;

    // Search (Basic Metadata search)
    searchDocuments(query: string, filters: any): Promise<KnowledgeDocument[]>;
}
