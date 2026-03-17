import { Router } from "express";
import { AgentController } from "../controllers/AgentController";
import { InMemoryAgentRegistry } from "../../infrastructure/agents/InMemoryAgentRegistry";

const router = Router();
export const globalAgentRegistry = new InMemoryAgentRegistry();
const controller = new AgentController(globalAgentRegistry);

router.post("/", (req, res) => controller.register(req, res));
router.get("/", (req, res) => controller.list(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));

export default router;
