import { Request, Response } from "express";
import { BuildSessionTimeline } from "../../application/use-cases/BuildSessionTimeline";
import { BuildTaskTimeline } from "../../application/use-cases/BuildTaskTimeline";

export class ObservabilityController {
    constructor(
        private readonly buildSessionTimeline: BuildSessionTimeline,
        private readonly buildTaskTimeline: BuildTaskTimeline
    ) { }

    async getSessionTimeline(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const timeline = await this.buildSessionTimeline.execute(id);
            return res.status(200).json(timeline);
        } catch (error: any) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: error.message,
                },
            });
        }
    }

    async getTaskTimeline(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const timeline = await this.buildTaskTimeline.execute(taskId);
            return res.status(200).json(timeline);
        } catch (error: any) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: error.message,
                },
            });
        }
    }
}
