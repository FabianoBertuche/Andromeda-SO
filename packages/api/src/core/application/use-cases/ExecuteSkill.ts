import { Skill } from "../../domain/skill/Skill";
import { ScriptSkillRuntime, SkillExecutionContext } from "../../../infrastructure/skills/ScriptSkillRuntime";

export class ExecuteSkill {
    private runtime: ScriptSkillRuntime;

    constructor() {
        this.runtime = new ScriptSkillRuntime();
    }

    async execute(skill: Skill, input: Record<string, any>): Promise<any> {
        if (skill.getType() !== "script") {
            throw new Error(`Tipo de skill não suportado no momento: ${skill.getType()}`);
        }

        const code = skill.getCode();
        if (!code) throw new Error("Código da skill não encontrado");

        const context: SkillExecutionContext = { input };
        return await this.runtime.run(code, context);
    }
}
