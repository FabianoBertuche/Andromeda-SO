import { Request, Response } from "express";
import { ReceiveGatewayMessage } from "../../application/use-cases/ReceiveGatewayMessage";
import { GetSession } from "../../application/use-cases/GetSession";
import { ListSessionMessages } from "../../application/use-cases/ListSessionMessages";
import { GetGatewayTaskStatus } from "../../application/use-cases/GetGatewayTaskStatus";

export class CommunicationController {
    constructor(
        private readonly receiveGatewayMessage: ReceiveGatewayMessage,
        private readonly getSession: GetSession,
        private readonly listSessionMessages: ListSessionMessages,
        private readonly getGatewayTaskStatus: GetGatewayTaskStatus
    ) { }

    async handleMessage(req: Request, res: Response) {
        try {
            const auth = (req as any).gatewayAuth;
            const response = await this.receiveGatewayMessage.execute(req.body, auth);
            return res.status(200).json(response);
        } catch (error: any) {
            return res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: error.message || "Invalid gateway message payload",
                },
            });
        }
    }

    async getSessionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const session = await this.getSession.execute(id);
            return res.status(200).json(session);
        } catch (error: any) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: error.message,
                },
            });
        }
    }

    async getMessagesBySessionId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const messages = await this.listSessionMessages.execute(id);
            return res.status(200).json(messages);
        } catch (error: any) {
            return res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: error.message,
                },
            });
        }
    }

    async getTaskStatus(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const status = await this.getGatewayTaskStatus.execute(taskId);
            return res.status(200).json(status);
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
