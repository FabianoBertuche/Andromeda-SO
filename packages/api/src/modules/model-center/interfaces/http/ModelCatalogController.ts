import { Request, Response } from "express";
import { globalModelRepository } from "../../../../infrastructure/repositories/GlobalRepositories";

export class ModelCatalogController {
    async list(req: Request, res: Response) {
        try {
            const models = await globalModelRepository.findAll();
            res.json(models);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const model = await globalModelRepository.findById(id) || await globalModelRepository.findByExternalId(id);
            if (!model) return res.status(404).json({ error: "Modelo não encontrado" });
            res.json(model);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
