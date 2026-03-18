import { Capability } from "../../../domain/model/Capability";
import { IModelRepository } from "../../../domain/model/IModelRepository";
import { IRoutingDecisionRepository } from "../../../domain/router/IRoutingDecisionRepository";
import { RoutingDecision } from "../../../domain/router/RoutingDecision";

export interface RouteTaskInputDTO {
    taskId: string;
    activityType: Capability | string;
    requiredCapabilities: Capability[];
    maxCost?: number;
}

export class RouteTaskUseCase {
    constructor(
        private modelRepository: IModelRepository,
        private routingDecisionRepo: IRoutingDecisionRepository
    ) { }

    async execute(input: RouteTaskInputDTO): Promise<RoutingDecision> {
        const startTime = Date.now();

        // 1. Obter modelos habilitados
        const allModels = await this.modelRepository.findAll();
        const enabledModels = allModels.filter(m => m.isEnabled() && m.getHealth() !== "error");

        // 2. Filtrar por capacidades requeridas
        const eligibleModels = enabledModels.filter(m => {
            const modelCaps = m.getCapabilities();
            return input.requiredCapabilities.every(cap => modelCaps.includes(cap));
        });

        if (eligibleModels.length === 0) {
            throw new Error("Não foram encontrados modelos elegíveis para as capacidades requeridas");
        }

        // 3. Ordenar por score da atividade (lógica simplificada para MVP)
        eligibleModels.sort((a, b) => {
            const scoreA = a.getScores()[input.activityType] || a.getScores().overall || 0;
            const scoreB = b.getScores()[input.activityType] || b.getScores().overall || 0;
            return scoreB - scoreA;
        });

        const chosenModel = eligibleModels[0];
        const fallbackModel = eligibleModels.length > 1 ? eligibleModels[1] : undefined;

        const latencyMs = Date.now() - startTime;

        // 4. Registrar a decisão
        const decision = new RoutingDecision({
            taskId: input.taskId,
            activityType: input.activityType,
            requiredCapabilities: input.requiredCapabilities,
            candidatesEvaluated: eligibleModels.map(m => m.getId()),
            chosenModelId: chosenModel.getId(),
            fallbackModelId: fallbackModel?.getId(),
            score: chosenModel.getScores()[input.activityType] || chosenModel.getScores().overall || 0,
            latencyMs,
            justification: `Escolha baseada no maior score para a atividade ${input.activityType} entre os modelos aptos a resolver.`,
        });

        await this.routingDecisionRepo.save(decision);

        return decision;
    }
}
