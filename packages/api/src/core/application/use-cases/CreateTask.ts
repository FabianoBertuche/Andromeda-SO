import { Task } from "../../domain/task/Task";
import { TaskRepository } from "../../domain/task/TaskRepository";

export interface CreateTaskInput {
    rawRequest: string;
    metadata?: Record<string, any>;
}

export class CreateTask {
    constructor(private readonly repository: TaskRepository) { }

    async execute(input: CreateTaskInput): Promise<Task> {
        const task = new Task({
            rawRequest: input.rawRequest,
            metadata: input.metadata
        });

        await this.repository.save(task);

        return task;
    }
}
