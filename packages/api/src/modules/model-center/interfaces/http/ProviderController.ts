import { Request, Response } from "express";
import {
    registerProviderUseCase,
    syncModelsUseCase,
    pullModelUseCase,
    deleteModelUseCase,
    showModelInfoUseCase,
    listRunningModelsUseCase,
    createModelUseCase,
    copyModelUseCase
} from "../../dependencies";
import { globalProviderRepository } from "../../../../infrastructure/repositories/GlobalRepositories";

export class ProviderController {
    // ... existing methods ...
    async register(req: Request, res: Response) {
        try {
            const provider = await registerProviderUseCase.execute(req.body);
            res.status(201).json(provider);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const providers = await globalProviderRepository.findAll();
            res.json(providers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async syncModels(req: Request, res: Response) {
        try {
            const pId = await this.ensureProviderId(req.params.id);
            const models = await syncModelsUseCase.execute({ providerId: pId });
            res.json(models);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async pullModel(req: Request, res: Response) {
        try {
            const pId = await this.ensureProviderId(req.params.id);
            const { modelName } = req.body;

            // Set streaming headers if needed, but here we just wait for completion in the use case
            // In a better MVP we would stream the progress back to client via SSE or Socket.io.
            await pullModelUseCase.execute({
                providerId: pId,
                modelName
            });
            res.json({ message: `Model ${modelName} pulled successfully` });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteModel(req: Request, res: Response) {
        try {
            const pId = await this.ensureProviderId(req.params.id);
            const { modelName } = req.params;
            await deleteModelUseCase.execute({ providerId: pId, modelName });
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async listRunningModels(req: Request, res: Response) {
        try {
            const pId = await this.ensureProviderId(req.params.id);
            const models = await listRunningModelsUseCase.execute({ providerId: pId });
            res.json(models);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async showModelInfo(req: Request, res: Response) {
        try {
            const pId = await this.ensureProviderId(req.params.id);
            const { modelName } = req.params;
            const info = await showModelInfoUseCase.execute({ providerId: pId, modelName });
            res.json(info);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async createModel(req: Request, res: Response) {
        try {
            const pId = await this.ensureProviderId(req.params.id);
            const { name, modelfile } = req.body;
            await createModelUseCase.execute({ providerId: pId, name, modelfile });
            res.status(201).json({ message: `Model ${name} created successfully` });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async copyModel(req: Request, res: Response) {
        try {
            const pId = await this.ensureProviderId(req.params.id);
            const { source, destination } = req.body;
            await copyModelUseCase.execute({ providerId: pId, source, destination });
            res.json({ message: `Model copied from ${source} to ${destination}` });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    private async ensureProviderId(id: string): Promise<string> {
        const providers = await globalProviderRepository.findAll();
        if (id === "ollama-local-id" && providers.length === 0) {
            await registerProviderUseCase.execute({
                name: "Ollama Local",
                type: "ollama",
                baseUrl: "http://localhost:11434"
            });
            const np = await globalProviderRepository.findAll();
            return np[0].getId();
        } else if (id === "ollama-local-id") {
            return providers[0].getId();
        }
        return id;
    }
}

