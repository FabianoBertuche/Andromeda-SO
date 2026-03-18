import { Router } from "express";
import { CommunicationController } from "./communication.controller";
import { ReceiveGatewayMessage } from "../../application/use-cases/ReceiveGatewayMessage";
import { ResolveSession } from "../../application/use-cases/ResolveSession";
import { CreateTaskFromMessage } from "../../application/use-cases/CreateTaskFromMessage";
import { GetSession } from "../../application/use-cases/GetSession";
import { ListSessionMessages } from "../../application/use-cases/ListSessionMessages";
import { GetGatewayTaskStatus } from "../../application/use-cases/GetGatewayTaskStatus";
import { WebChannelAdapter } from "../../infrastructure/channels/web/web-channel.adapter";
import { StaticTokenChannelAuthAdapter } from "../../infrastructure/auth/static-token-channel-auth.adapter";
import { globalSessionRepository, globalMessageRepository } from "../../infrastructure/persistence/GlobalCommunicationRepositories";
import { globalTaskRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { createGatewayAuthMiddleware } from "./middlewares/gateway-auth.middleware";
import { CreateTask } from "../../../../core/application/use-cases/CreateTask";

const router = Router();

// Dependências
const webChannelAdapter = new WebChannelAdapter();
const authAdapter = new StaticTokenChannelAuthAdapter();
const resolveSession = new ResolveSession(globalSessionRepository);
const createTaskUseCase = new CreateTask(globalTaskRepository);
const createTaskFromMessage = new CreateTaskFromMessage(createTaskUseCase);

const receiveGatewayMessage = new ReceiveGatewayMessage(
    webChannelAdapter,
    resolveSession,
    globalMessageRepository,
    createTaskFromMessage
);

const getSession = new GetSession(globalSessionRepository);
const listSessionMessages = new ListSessionMessages(globalMessageRepository);
const getGatewayTaskStatus = new GetGatewayTaskStatus(globalTaskRepository);

const controller = new CommunicationController(
    receiveGatewayMessage,
    getSession,
    listSessionMessages,
    getGatewayTaskStatus
);

// Middleware
const authMiddleware = createGatewayAuthMiddleware(authAdapter);

// Rotas
router.post("/message", authMiddleware, (req, res) => controller.handleMessage(req, res));
router.get("/sessions/:id", (req, res) => controller.getSessionById(req, res));
router.get("/sessions/:id/messages", (req, res) => controller.getMessagesBySessionId(req, res));
router.get("/tasks/:taskId/status", (req, res) => controller.getTaskStatus(req, res));

export default router;
