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
import { CreateTask, TaskRepository, ExecuteTask, ExecutionStrategyFactory, globalEventBus, ExecuteSkill, TaskCreated } from "@andromeda/core";
import { ObservabilityController } from "./observability.controller";
import { BuildSessionTimeline } from "../../application/use-cases/BuildSessionTimeline";
import { BuildTaskTimeline } from "../../application/use-cases/BuildTaskTimeline";

import { globalWsGateway } from "../websocket/communication.ws-gateway";
import { SkillExecutionStrategy } from "../../../../infrastructure/execution/SkillExecutionStrategy";
import { LLMExecutionStrategy } from "../../../../infrastructure/execution/LLMExecutionStrategy";
import { globalSkillRegistry } from "../../../../presentation/routes/skillRoutes";
import { globalAgentRegistry } from "../../../../presentation/routes/agentRoutes";

const router = Router();

// Dependências
const webChannelAdapter = new WebChannelAdapter();
const authAdapter = new StaticTokenChannelAuthAdapter();
const resolveSession = new ResolveSession(globalSessionRepository);
const createTaskUseCase = new CreateTask(globalTaskRepository);
const createTaskFromMessage = new CreateTaskFromMessage(createTaskUseCase);

// Setup Factory para Execução Automática das Tasks
const executeSkill = new ExecuteSkill();
const skillStrategy = new SkillExecutionStrategy(globalSkillRegistry, executeSkill);
const llmStrategy = new LLMExecutionStrategy(globalAgentRegistry);
const factory = new ExecutionStrategyFactory();
factory.register("skill", skillStrategy);
factory.register("llm", llmStrategy);

const executeTaskUseCase = new ExecuteTask(globalTaskRepository, factory, globalEventBus);

// Gatilho global para rodar Tasks criadas pelo Gateway
globalEventBus.subscribe("TaskCreated", async (event: any) => {
    if (event instanceof TaskCreated) {
        if (!event.taskId) return;
        try {
            console.log(`[EventBus] TaskCreated capturado! Auto-executando task ${event.taskId}...`);
            await executeTaskUseCase.execute(event.taskId);
        } catch (e) {
            console.error(`[EventBus] Falha ao auto-executar task ${event.taskId}:`, e);
        }
    }
});

const receiveGatewayMessage = new ReceiveGatewayMessage(
    webChannelAdapter,
    resolveSession,
    globalMessageRepository,
    createTaskFromMessage
);

// Injetar caso de uso no WebSocket Gateway
globalWsGateway.setReceiveGatewayMessage(receiveGatewayMessage);

const getSession = new GetSession(globalSessionRepository);
const listSessionMessages = new ListSessionMessages(globalMessageRepository);
const getGatewayTaskStatus = new GetGatewayTaskStatus(globalTaskRepository);

const controller = new CommunicationController(
    receiveGatewayMessage,
    getSession,
    listSessionMessages,
    getGatewayTaskStatus
);

const buildSessionTimeline = new BuildSessionTimeline(globalMessageRepository, globalTaskRepository);
const buildTaskTimeline = new BuildTaskTimeline(globalTaskRepository);
const observabilityController = new ObservabilityController(buildSessionTimeline, buildTaskTimeline);

// Middleware
const authMiddleware = createGatewayAuthMiddleware(authAdapter);

// Rotas
router.post("/message", authMiddleware, (req, res) => controller.handleMessage(req, res));
router.get("/sessions/:id", (req, res) => controller.getSessionById(req, res));
router.get("/sessions/:id/messages", (req, res) => controller.getMessagesBySessionId(req, res));
router.get("/sessions/:id/timeline", (req, res) => observabilityController.getSessionTimeline(req, res));
router.get("/tasks/:taskId/status", (req, res) => controller.getTaskStatus(req, res));
router.get("/tasks/:taskId/timeline", (req, res) => observabilityController.getTaskTimeline(req, res));

export default router;
