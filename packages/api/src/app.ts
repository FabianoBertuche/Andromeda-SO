import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { sendError } from "./shared/http/error-response";
import { getAllowedConnectSources, isOriginAllowed } from "./shared/http/origin-config";
import { requestContextMiddleware } from "./shared/http/request-context";

console.log("Initializing Andromeda OS Express App...");

import taskRoutes from "./presentation/routes/taskRoutes";
import skillRoutes from "./presentation/routes/skillRoutes";
import agentRoutes from "./presentation/routes/agentRoutes";
import { sandboxRouter } from "./modules/sandbox/dependencies";
import { memoryRouter } from "./modules/memory/dependencies";
import communicationRoutes from "./modules/communication/interfaces/http/communication.routes";
import cognitiveRoutes from "./modules/cognitive/interfaces/http/cognitive.routes";
console.log("Importing modelCenterRoutes...");
import modelCenterRoutes from "./modules/model-center/interfaces/http/modelCenter.routes";
console.log("modelCenterRoutes imported!");
import knowledgeRouter from "./modules/knowledge/interfaces/http/knowledge.routes";

import { authController } from "./modules/auth/dependencies";
import { createAuthRoutes } from "./modules/auth/interfaces/http/auth.routes";
import { authMiddleware } from "./shared/middleware/auth.middleware";
import { requireRole } from "./shared/middleware/rbac.middleware";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: "Too many login attempts, please try again after a minute" }
});

const app = express();

app.disable("x-powered-by");
app.use(requestContextMiddleware);

morgan.token("request-id", (_req, res) => (res.getHeader("X-Request-ID") as string | undefined) || "-");

// ... (configurações helmet e cors mantidas)

// Rotas V1
const v1Router = express.Router();

v1Router.use("/auth", authLimiter, createAuthRoutes(authController));

import { tenantMiddleware } from "./shared/middleware/tenant.middleware";

// ... (v1Router setup anterior)

v1Router.use("/tasks", authMiddleware, tenantMiddleware, taskRoutes);
v1Router.use("/skills", authMiddleware, tenantMiddleware, skillRoutes);
v1Router.use("/agents", authMiddleware, tenantMiddleware, agentRoutes);
v1Router.use("/sandbox", authMiddleware, tenantMiddleware, sandboxRouter);
v1Router.use("/memory", authMiddleware, tenantMiddleware, memoryRouter);
v1Router.use("/gateway", authMiddleware, tenantMiddleware, communicationRoutes);
v1Router.use("/model-center", authMiddleware, tenantMiddleware, modelCenterRoutes);
v1Router.use("/internal/cognitive", authMiddleware, tenantMiddleware, cognitiveRoutes);

app.use("/v1", v1Router);

app.use("/console", express.static(path.join(__dirname, "modules/communication/interfaces/http/public")));

app.use("/console", express.static(path.join(__dirname, "modules/communication/interfaces/http/public")));

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use((error: Error & { status?: number; statusCode?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    const status = error.statusCode || error.status || 500;
    const code = status === 403 ? "CORS_FORBIDDEN" : "INTERNAL_SERVER_ERROR";

    console.error(`[HTTP:${res.locals.requestId || "unknown"}]`, error.stack || error.message);
    sendError(req, res, status, code, status === 500 ? "Unexpected server error" : error.message);
});

export default app;
