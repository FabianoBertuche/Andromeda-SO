import { Request, Response } from "express";
import { CreateTask } from "../../core/application/use-cases/CreateTask";
import { ExecuteTask } from "../../core/application/use-cases/ExecuteTask";
import { TaskRepository } from "../../core/domain/task/TaskRepository";
import { ExecutionStrategyFactory } from "../../core/domain/execution/ExecutionStrategyFactory";
import { SkillExecutionStrategy } from "../../infrastructure/execution/SkillExecutionStrategy";
import { LLMExecutionStrategy } from "../../infrastructure/execution/LLMExecutionStrategy";
import { ExecuteSkill } from "../../core/application/use-cases/ExecuteSkill";
import { globalSkillRegistry } from "../routes/skillRoutes";
import { globalAgentRegistry } from "../routes/agentRoutes";

export class TaskController {
    constructor(private readonly repository: TaskRepository) { }

    async create(req: Request, res: Response) {
        try {
            const { raw_request, metadata } = req.body;
            if (!raw_request) {
                return res.status(400).json({ error: "raw_request is required" });
            }

            const useCase = new CreateTask(this.repository);
            const task = await useCase.execute({
                rawRequest: raw_request,
                metadata: metadata || {}
            });

            return res.status(201).json(task.toJSON());
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const tasks = await this.repository.findAll();
            return res.json(tasks.map((t) => t.toJSON()));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const task = await this.repository.findById(req.params.id);
            if (!task) return res.status(404).json({ error: "Task not found" });
            return res.json(task.toJSON());
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async execute(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const executeSkill = new ExecuteSkill();
            const skillStrategy = new SkillExecutionStrategy(globalSkillRegistry, executeSkill);
            const llmStrategy = new LLMExecutionStrategy(globalAgentRegistry);
            const factory = new ExecutionStrategyFactory(globalSkillRegistry, skillStrategy, llmStrategy);

            const useCase = new ExecuteTask(this.repository, factory);
            const task = await useCase.execute(id);

            return res.json(task.toJSON());
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }
}
