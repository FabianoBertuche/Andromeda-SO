import { describe, expect, it, vi } from "vitest";
import { GatewayMessageRequestDto } from "../dto/gateway-message.request.dto";
import { ReceiveGatewayMessage } from "./ReceiveGatewayMessage";
import { ResolveSession } from "./ResolveSession";
import { CreateTaskFromMessage } from "./CreateTaskFromMessage";
import { UnifiedMessage } from "../../domain/entities/unified-message.entity";
import { InMemoryCommunicationSessionRepository } from "../../infrastructure/persistence/in-memory-communication-session.repository";
import { InMemoryCommunicationMessageRepository } from "../../infrastructure/persistence/in-memory-communication-message.repository";
import { ChannelAdapterPort } from "../../domain/ports/integration.ports";

describe("ReceiveGatewayMessage", () => {
    it("keeps gateway normalization, auth, session resolution and unified response intact", async () => {
        const normalized = new UnifiedMessage({
            id: "msg-1",
            channel: "web",
            role: "user",
            sender: {
                isAuthenticated: true,
            },
            session: {
                id: "",
            },
            content: {
                type: "text",
                text: "ping hybrid foundation",
            },
            metadata: {
                requestId: "req-1",
                correlationId: "corr-1",
                timestamp: "2026-03-18T12:00:00.000Z",
            },
        });

        const channelAdapter: ChannelAdapterPort = {
            channel: "web",
            normalize: vi.fn().mockResolvedValue(normalized),
            buildResponse: vi.fn(),
        };

        const sessionRepository = new InMemoryCommunicationSessionRepository();
        const messageRepository = new InMemoryCommunicationMessageRepository();
        const resolveSession = new ResolveSession(sessionRepository);
        const createTaskFromMessage = {
            execute: vi.fn().mockResolvedValue({
                taskId: "task-1",
                status: "RECEIVED",
            }),
        } as unknown as CreateTaskFromMessage;

        const useCase = new ReceiveGatewayMessage(
            channelAdapter,
            resolveSession,
            messageRepository,
            createTaskFromMessage
        );

        const input: GatewayMessageRequestDto = {
            channel: "web",
            sender: {
                isAuthenticated: true,
            },
            content: {
                type: "text",
                text: "ping hybrid foundation",
            },
            metadata: {
                requestId: "req-1",
            },
        };

        const response = await useCase.execute(input, {
            clientId: "client_web",
            scopes: ["gateway:message:send"],
        });

        expect(channelAdapter.normalize).toHaveBeenCalledWith(input);
        expect((createTaskFromMessage as any).execute).toHaveBeenCalledWith(expect.objectContaining({
            sessionId: response.sessionId,
        }));
        expect(response.task?.id).toBe("task-1");
        expect(response.meta?.requestId).toBe("req-1");
        expect(response.meta?.correlationId).toBe("corr-1");

        const persistedMessages = await messageRepository.findBySessionId(response.sessionId);
        expect(persistedMessages).toHaveLength(1);
        expect(persistedMessages[0].metadata.auth?.clientId).toBe("client_web");
    });
});
