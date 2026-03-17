import { Request, Response } from "express";
import { SkillRegistry } from "../../core/domain/skill/SkillRegistry";
import { Skill, SkillType } from "../../core/domain/skill/Skill";
import { ExecuteSkill } from "../../core/application/use-cases/ExecuteSkill";

export class SkillController {
    constructor(private readonly registry: SkillRegistry) { }

    async register(req: Request, res: Response) {
        try {
            const { id, name, description, type, schema, code } = req.body;
            const skill = new Skill({ id, name, description, type: type as SkillType, schema, code });
            await this.registry.register(skill);
            return res.status(201).json(skill.toJSON());
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const skills = await this.registry.listAll();
            return res.json(skills.map((s) => s.toJSON()));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async execute(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { input } = req.body;
            const skill = await this.registry.findById(id);

            if (!skill) return res.status(404).json({ error: "Skill não encontrada" });

            const useCase = new ExecuteSkill();
            const result = await useCase.execute(skill, input || {});

            return res.json({ result });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
