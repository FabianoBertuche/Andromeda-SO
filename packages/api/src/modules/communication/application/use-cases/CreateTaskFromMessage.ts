import { UnifiedMessage } from "../../domain/entities/unified-message.entity";
import { CreateTask } from "@andromeda/core";

export interface CreateTaskFromMessageInput {
    sessionId: string;
    message: UnifiedMessage;
}

export class CreateTaskFromMessage {
    constructor(private readonly createTaskUseCase: CreateTask) { }

    async execute(input: CreateTaskFromMessageInput) {
        const { message, sessionId } = input;

        const task = await this.createTaskUseCase.execute({
            rawRequest: message.content.text || "",
            metadata: {
                ...message.metadata.context,
                sourceChannel: message.channel,
                sessionId: sessionId,
                correlationId: message.metadata.correlationId,
                originMessageId: message.id,
                requestId: message.metadata.requestId,
                modelId: message.metadata.modelId,
            },
        });

        return {
            taskId: task.getId(),
            status: task.getStatus(),
        };
    }
}
