import { Response } from "express";
import { CreateTask, TaskRepository } from "@andromeda/core";
import { createDefaultExecuteTaskUseCase } from "../../infrastructure/execution/createDefaultExecuteTaskUseCase";
import { globalAgentRegistry } from "../routes/agentRoutes";
import { RequestWithContext } from "../../shared/http/request-context";

export class TaskController {
    constructor(private readonly repository: TaskRepository) { }

    async create(req: RequestWithContext, res: Response) {
        try {
            const { raw_request, metadata } = req.body;
            if (!raw_request) {
                return res.status(400).json({ error: "raw_request is required" });
            }

            const useCase = new CreateTask(this.repository);
            const task = await useCase.execute({
                rawRequest: raw_request,
                metadata: {
                    ...(metadata || {}),
                    tenantId: req.tenantId || req.user?.tenantId || "default",
                    userId: req.user?.id,
                },
            });

            return res.status(201).json(task.toJSON());
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }

    async list(_req: RequestWithContext, res: Response) {
        try {
            const tasks = await this.repository.findAll();
            return res.json(tasks.map((task) => task.toJSON()));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getById(req: RequestWithContext, res: Response) {
        try {
            const task = await this.repository.findById(req.params.id);
            if (!task) return res.status(404).json({ error: "Task not found" });
            return res.json(task.toJSON());
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async execute(req: RequestWithContext, res: Response) {
        try {
            const useCase = createDefaultExecuteTaskUseCase(this.repository, globalAgentRegistry);
            const task = await useCase.execute(req.params.id);

            return res.json(task.toJSON());
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }
}
