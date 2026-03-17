import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import taskRoutes from "./presentation/routes/taskRoutes";
import skillRoutes from "./presentation/routes/skillRoutes";
import agentRoutes from "./presentation/routes/agentRoutes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/tasks", taskRoutes);
app.use("/skills", skillRoutes);
app.use("/agents", agentRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

export default app;
