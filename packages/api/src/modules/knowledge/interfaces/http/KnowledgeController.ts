import { Request, Response } from "express";
import { CreateCollectionUseCase } from "../application/use-cases/CreateCollectionUseCase";
import { AddDocumentUseCase } from "../application/use-cases/AddDocumentUseCase";
import { IKnowledgeRepository } from "../../../../../core/src/domain/knowledge/IKnowledgeRepository";

export class KnowledgeController {
    constructor(
        private knowledgeRepository: IKnowledgeRepository,
        private createCollectionUseCase: CreateCollectionUseCase,
        private addDocumentUseCase: AddDocumentUseCase
    ) { }

    async createCollection(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.createCollectionUseCase.execute(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async listCollections(req: Request, res: Response): Promise<void> {
        try {
            const { scopeType, scopeId } = req.query;
            const result = await this.knowledgeRepository.listCollections({
                scopeType: scopeType as any,
                scopeId: scopeId as string,
            });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async addDocument(req: Request, res: Response): Promise<void> {
        try {
            const { collectionId } = req.params;
            const result = await this.addDocumentUseCase.execute({
                ...req.body,
                collectionId,
            });
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async listDocuments(req: Request, res: Response): Promise<void> {
        try {
            const { collectionId } = req.params;
            const result = await this.knowledgeRepository.listDocuments(collectionId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
