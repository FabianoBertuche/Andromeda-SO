import { IKnowledgeRepository } from "../../../../../core/src/domain/knowledge/IKnowledgeRepository";
import { KnowledgeDocument, KnowledgeSourceType, KnowledgeStatus } from "../../../../../core/src/domain/knowledge/types";

export interface AddDocumentDTO {
    collectionId: string;
    title: string;
    sourceType: KnowledgeSourceType;
    sourcePath?: string;
    mimeType?: string;
    rawText?: string;
    metadata?: Record<string, any>;
}

export class AddDocumentUseCase {
    constructor(private knowledgeRepository: IKnowledgeRepository) { }

    async execute(dto: AddDocumentDTO): Promise<KnowledgeDocument> {
        const documentData: Partial<KnowledgeDocument> = {
            collectionId: dto.collectionId,
            title: dto.title,
            sourceType: dto.sourceType,
            sourcePath: dto.sourcePath,
            mimeType: dto.mimeType,
            rawText: dto.rawText,
            status: KnowledgeStatus.PENDING, // Always starts as pending for processing
            metadata: dto.metadata || {},
        };

        const document = await this.knowledgeRepository.addDocument(dto.collectionId, documentData);

        // Note: In a real flow, this would trigger an event or call a service for chunking
        // TriggerProcessingEvent(document.id);

        return document;
    }
}
