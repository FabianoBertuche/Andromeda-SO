import { SkillRegistry } from "../../domain/skill/SkillRegistry";
import { Skill } from "../../domain/skill/Skill";

export class ResolveSkill {
    constructor(private readonly registry: SkillRegistry) { }

    async execute(query: string): Promise<Skill | null> {
        const results = await this.registry.searchByCapability(query);

        // Simplificação do MVP: retorna a primeira correspondência.
        // Futuramente, aqui entraria um LLM Router ou heuristicas mais complexas.
        return results.length > 0 ? results[0] : null;
    }
}
