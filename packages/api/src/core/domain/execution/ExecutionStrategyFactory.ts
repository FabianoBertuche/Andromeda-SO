import { Task } from "../task/Task";
import { ExecutionStrategy } from "./ExecutionStrategy";
import { SkillRegistry } from "../skill/SkillRegistry";

export class ExecutionStrategyFactory {
    constructor(
        private readonly skillRegistry: SkillRegistry,
        private readonly skillStrategy: ExecutionStrategy,
        private readonly llmStrategy: ExecutionStrategy
    ) { }

    async getStrategy(task: Task): Promise<ExecutionStrategy> {
        // Regra Skill-First: tenta resolver uma skill baseada no pedido raw
        const skills = await this.skillRegistry.searchByCapability(task.getRawRequest());

        if (skills.length > 0) {
            // Se encontrou uma skill compatível, usa a estratégia de Skill
            // No futuro, podemos injetar qual skill foi encontrada no metadados da task
            return this.skillStrategy;
        }

        // Fallback para LLM
        return this.llmStrategy;
    }
}
