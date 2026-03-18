import { Request, Response } from "express";
import { runBenchmarkUseCase } from "../../dependencies";
import { globalBenchmarkRepository } from "../../../../infrastructure/repositories/GlobalRepositories";

export class BenchmarkController {
    async run(req: Request, res: Response) {
        try {
            const result = await runBenchmarkUseCase.execute(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const results = await globalBenchmarkRepository.findByModelId(req.params.modelId);
            res.json(results);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
