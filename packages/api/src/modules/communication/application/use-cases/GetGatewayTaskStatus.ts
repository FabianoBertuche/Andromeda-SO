import { TaskRepository } from "../../../../core/domain/task/TaskRepository";

export class GetGatewayTaskStatus {
    constructor(private readonly taskRepository: TaskRepository) { }

    async execute(taskId: string) {
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        return {
            taskId: task.getId(),
            status: task.getStatus(),
            updatedAt: task.getUpdatedAt(),
        };
    }
}
