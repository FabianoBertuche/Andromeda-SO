import { CommunicationMessageRepository } from "../../domain/repositories/communication-message.repository";
import { TaskRepository } from "@andromeda/core";
import { SessionTimelineView, TimelineEntry } from "../dto/timeline.view.dto";

export class BuildSessionTimeline {
    constructor(
        private readonly messageRepository: CommunicationMessageRepository,
        private readonly taskRepository: TaskRepository
    ) { }

    async execute(sessionId: string): Promise<SessionTimelineView> {
        const messages = await this.messageRepository.findBySessionId(sessionId);
        const tasks = await this.taskRepository.findBySessionId(sessionId);

        const entries: TimelineEntry[] = [];

        // Add message entries
        for (const msg of messages) {
            entries.push({
                type: "message.received",
                timestamp: msg.metadata.timestamp || new Date().toISOString(),
                description: `Mensagem recebida: ${msg.content.text?.substring(0, 50)}...`,
                metadata: { messageId: msg.id, channel: msg.channel }
            });
        }

        // Add task entries
        for (const task of tasks) {
            entries.push({
                type: "task.created",
                timestamp: task.getCreatedAt().toISOString(),
                description: `Task criada: ${task.getId()}`,
                metadata: { taskId: task.getId(), status: task.getStatus() }
            });

            if (task.getStatus() === "completed" || task.getStatus() === "failed") {
                entries.push({
                    type: "task.finished",
                    timestamp: task.getUpdatedAt().toISOString(),
                    description: `Task ${task.getStatus()}: ${task.getId()}`,
                    metadata: { taskId: task.getId(), status: task.getStatus(), result: task.getResult() }
                });
            }
        }

        // Sort by timestamp
        entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return {
            sessionId,
            entries
        };
    }
}
