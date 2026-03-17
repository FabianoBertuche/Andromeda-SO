import { Router } from "express";
import { SkillController } from "../controllers/SkillController";
import { InMemorySkillRegistry } from "../../infrastructure/skills/InMemorySkillRegistry";

const router = Router();
// Para o MVP, usamos uma única instância do registry (em memória)
export const globalSkillRegistry = new InMemorySkillRegistry();
const controller = new SkillController(globalSkillRegistry);

router.post("/", (req, res) => controller.register(req, res));
router.get("/", (req, res) => controller.list(req, res));
router.post("/:id/execute", (req, res) => controller.execute(req, res));

export default router;
