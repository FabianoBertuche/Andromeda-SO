import { Task } from "../task/Task";

export interface ExecutionResult {
    success: boolean;
    data: any;
    strategyUsed: string;
    error?: string;
}

export interface ExecutionStrategy {
    execute(task: Task): Promise<ExecutionResult>;
    getIdentifier(): string;
}
