import { CreateTask, TaskRepository } from "@andromeda/core";
import { v4 as uuidv4 } from "uuid";
import { createDefaultExecuteTaskUseCase } from "../../../infrastructure/execution/createDefaultExecuteTaskUseCase";
import { FileBackedAgentRegistry } from "../infrastructure/FileBackedAgentRegistry";

export interface AgentConversationInput {
    agentId: string;
    prompt: string;
    sessionId?: string;
    modelId?: string;
    interactionMode?: string;
}

export class RuntimeAgentConversationService {
    constructor(
        private readonly taskRepository: TaskRepository,
        private readonly agentRegistry: FileBackedAgentRegistry,
    ) { }

    async chat(input: AgentConversationInput) {
        const createTask = new CreateTask(this.taskRepository);
        const executeTask = createDefaultExecuteTaskUseCase(this.taskRepository, this.agentRegistry);
        const sessionId = input.sessionId || `agent-session-${uuidv4()}`;

        const task = await createTask.execute({
            rawRequest: input.prompt,
            metadata: {
                sessionId,
                targetAgentId: input.agentId,
                interactionMode: input.interactionMode || "chat",
                modelId: input.modelId,
            },
        });

        const executed = await executeTask.execute(task.getId());

        return {
            taskId: executed.getId(),
            status: executed.getStatus(),
            sessionId,
            result: executed.getResult(),
            audit: executed.getAuditParecer() || executed.getResult()?.audit,
        };
    }
}
