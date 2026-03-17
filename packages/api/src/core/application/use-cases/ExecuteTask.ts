import { TaskRepository } from "../../domain/task/TaskRepository";
import { ExecutionStrategyFactory } from "../../domain/execution/ExecutionStrategyFactory";
import { TaskStatus } from "../../domain/task/TaskState";
import { Task } from "../../domain/task/Task";

export class ExecuteTask {
    constructor(
        private readonly repository: TaskRepository,
        private readonly factory: ExecutionStrategyFactory
    ) { }

    async execute(taskId: string): Promise<Task> {
        const task = await this.repository.findById(taskId);
        if (!task) throw new Error("Tarefa não encontrada");

        try {
            // Segue o fluxo definido no PRD e na Máquina de Estados
            console.log(`[ExecuteTask] Iniciando estruturação para ${taskId}`);
            task.transitionTo(TaskStatus.STRUCTURING);
            await this.repository.save(task);

            console.log(`[ExecuteTask] Resolvendo estratégia para ${taskId}`);
            task.transitionTo(TaskStatus.RESOLVING);
            await this.repository.save(task);

            console.log(`[ExecuteTask] Iniciando execução para ${taskId}`);
            task.transitionTo(TaskStatus.EXECUTING);
            await this.repository.save(task);

            // 2. Resolve e executa estratégia
            const strategy = await this.factory.getStrategy(task);
            const result = await strategy.execute(task);

            if (result.success) {
                task.setResult(result.data);
                task.transitionTo(TaskStatus.AUDITING); // Próxima fase do pipeline
            } else {
                task.transitionTo(TaskStatus.FAILED);
                task.setResult({ error: result.error });
            }

            await this.repository.save(task);
            return task;
        } catch (error: any) {
            task.transitionTo(TaskStatus.FAILED);
            task.setResult({ error: error.message });
            await this.repository.save(task);
            throw error;
        }
    }
}
