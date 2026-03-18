import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

console.log("Initializing Andromeda OS Express App...");

import taskRoutes from "./presentation/routes/taskRoutes";
import skillRoutes from "./presentation/routes/skillRoutes";
import agentRoutes from "./presentation/routes/agentRoutes";
import communicationRoutes from "./modules/communication/interfaces/http/communication.routes";

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"],
            "script-src-attr": ["'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "img-src": ["'self'", "data:", "https:*"],
            "connect-src": ["'self'", "http://localhost:5000"],
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/tasks", taskRoutes);
app.use("/skills", skillRoutes);
app.use("/agents", agentRoutes);
app.use("/gateway", communicationRoutes);

app.use("/console", express.static(path.join(__dirname, "modules/communication/interfaces/http/public")));

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

export default app;
