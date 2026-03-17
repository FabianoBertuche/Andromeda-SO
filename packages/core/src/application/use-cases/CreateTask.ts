import { Task, TaskRepository } from "@domain/task";

export interface CreateTaskInput {
    rawRequest: string;
}

export class CreateTask {
    constructor(private readonly repository: TaskRepository) { }

    async execute(input: CreateTaskInput): Promise<Task> {
        const task = new Task({
            rawRequest: input.rawRequest,
        });

        await this.repository.save(task);

        return task;
    }
}
