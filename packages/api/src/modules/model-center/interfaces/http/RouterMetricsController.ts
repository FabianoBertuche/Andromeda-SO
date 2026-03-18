import { Request, Response } from "express";
import { globalRoutingDecisionRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { routeTaskUseCase } from "../../dependencies";

export class RouterMetricsController {
    async getDecisions(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const decisions = await globalRoutingDecisionRepository.getRecentDecisions(limit);
            res.json(decisions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async simulateRoute(req: Request, res: Response) {
        try {
            const decision = await routeTaskUseCase.execute(req.body);
            res.json(decision.toJSON());
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
