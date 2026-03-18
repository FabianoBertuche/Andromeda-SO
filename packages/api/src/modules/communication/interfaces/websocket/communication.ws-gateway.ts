import { Server, Socket } from "socket.io";
import { globalEventBus, TaskCreated, TaskStatusChanged, TaskResultAvailable } from "@andromeda/core";
import { globalWsSessionRegistry } from "../../infrastructure/websocket/ws-session-registry";

export class CommunicationWsGateway {
    private io: Server | null = null;

    constructor() {
        this.setupEventListeners();
    }

    public initialize(io: Server) {
        this.io = io;
        this.io.use(this.middleware.bind(this));
        this.io.on("connection", this.handleConnection.bind(this));
        console.log("📡 CommunicationWsGateway initialized");
    }

    private middleware(socket: Socket, next: (err?: any) => void) {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

        // Simple mock authentication (matching MVP02 logic)
        if (token && (token === "andromeda-secret-token" || token.includes("Bearer"))) {
            (socket as any).user = { clientId: "web-console", scopes: ["admin"] };
            return next();
        }

        console.warn("❌ WS Connection rejected: Unauthorized");
        return next(new Error("Unauthorized"));
    }

    private receiveGatewayMessage?: any;

    public setReceiveGatewayMessage(useCase: any) {
        this.receiveGatewayMessage = useCase;
    }

    private async handleConnection(socket: Socket) {
        let currentSessionId = socket.handshake.query.sessionId as string;

        if (currentSessionId) {
            globalWsSessionRegistry.register(socket.id, currentSessionId);
            socket.join(`session:${currentSessionId}`);
            console.log(`🔌 WS Connected: Socket ${socket.id} joined session ${currentSessionId}`);
        } else {
            console.log(`🔌 WS Connected: Socket ${socket.id} (no session)`);
        }

        socket.on("disconnect", () => {
            globalWsSessionRegistry.unregister(socket.id);
            console.log(`🔌 WS Disconnected: Socket ${socket.id}`);
        });

        // Event for joining a session manually
        socket.on("session.join", (id: string) => {
            if (id) {
                currentSessionId = id;
                globalWsSessionRegistry.register(socket.id, id);
                socket.join(`session:${id}`);
                console.log(`🔌 Socket ${socket.id} explicitly joined session ${id}`);
            }
        });

        // Event for receiving messages from web console
        socket.on("client_message", async (payload: any) => {
            if (this.receiveGatewayMessage) {
                try {
                    const request = {
                        channel: "web",
                        session: { id: currentSessionId },
                        ...payload
                    };
                    const auth = (socket as any).user || { clientId: "web-console", scopes: [] };

                    await this.receiveGatewayMessage.execute(request, auth);
                } catch (error) {
                    console.error("❌ WS client_message Error:", error);
                }
            } else {
                console.warn("⚠️ receiveGatewayMessage not injected in WS Gateway!");
            }
        });
    }

    private setupEventListeners() {
        globalEventBus.subscribeAll((event) => {
            if (!this.io) return;

            const normalizedEvent = this.normalizeEvent(event);
            if (!normalizedEvent) return;

            // If event has sessionId, emit to that session room, otherwise broadcast
            if (normalizedEvent.sessionId) {
                this.io.to(`session:${normalizedEvent.sessionId}`).emit("gateway.event", normalizedEvent);
            } else {
                this.io.emit("gateway.event", normalizedEvent);
            }
        });
    }

    private normalizeEvent(event: any): any {
        const timestamp = new Date().toISOString();

        if (event instanceof TaskCreated) {
            return {
                type: "task.created",
                taskId: event.taskId,
                sessionId: event.sessionId,
                timestamp
            };
        }

        if (event instanceof TaskStatusChanged) {
            // Check if we can find sessionId for this task to route correctly
            // For now we might need to broadcast or look up
            return {
                type: "task.updated",
                taskId: event.taskId,
                status: event.newStatus,
                timestamp
            };
        }

        if (event instanceof TaskResultAvailable) {
            return {
                type: "task.completed",
                taskId: event.taskId,
                result: event.result,
                timestamp
            };
        }

        // Generic fallback for other domain events
        return {
            type: "domain.event",
            name: event.constructor.name,
            payload: event,
            timestamp
        };
    }
}

export const globalWsGateway = new CommunicationWsGateway();
