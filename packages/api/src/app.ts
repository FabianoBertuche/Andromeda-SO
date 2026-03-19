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

const app = express();

app.disable("x-powered-by");
app.use(requestContextMiddleware);

morgan.token("request-id", (_req, res) => (res.getHeader("X-Request-ID") as string | undefined) || "-");

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"],
            "script-src-attr": ["'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "img-src": ["'self'", "data:", "https:*"],
            "connect-src": getAllowedConnectSources(),
        },
    },
}));
app.use(cors({
    origin(origin, callback) {
        if (isOriginAllowed(origin)) {
            callback(null, true);
            return;
        }

        const error = new Error("Not allowed by CORS") as Error & { status?: number };
        error.status = 403;
        callback(error);
    },
    credentials: true,
    exposedHeaders: ["X-Request-ID"],
}));
app.use(express.json({ limit: process.env.HTTP_JSON_LIMIT || "1mb" }));
app.use(morgan(":method :url :status :response-time ms req_id=:request-id"));

app.use("/tasks", taskRoutes);
app.use("/skills", skillRoutes);
app.use("/agents", agentRoutes);
app.use("/sandbox", sandboxRouter);
app.use("/memory", memoryRouter);
app.use("/gateway", communicationRoutes);
app.use("/model-center", modelCenterRoutes);
app.use("/internal/cognitive", cognitiveRoutes);

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
