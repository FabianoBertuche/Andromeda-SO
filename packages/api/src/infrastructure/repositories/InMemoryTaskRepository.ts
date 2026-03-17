import { Task } from "../../core/domain/task/Task";
import { TaskRepository } from "../../core/domain/task/TaskRepository";

export class InMemoryTaskRepository implements TaskRepository {
    private tasks: Map<string, any> = new Map();

    async save(task: Task): Promise<void> {
        this.tasks.set(task.getId(), task.toJSON());
    }

    async findById(id: string): Promise<Task | null> {
        const data = this.tasks.get(id);
        if (!data) return null;
        return new Task(data);
    }

    async findAll(): Promise<Task[]> {
        return Array.from(this.tasks.values()).map((data) => new Task(data));
    }
}
