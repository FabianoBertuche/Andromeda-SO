import { Request, Response, NextFunction } from "express";
import { ChannelAuthPort } from "../../../domain/ports/integration.ports";

export function createGatewayAuthMiddleware(channelAuthPort: ChannelAuthPort) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        const token = extractBearerToken(authHeader);
        const channel = req.body?.channel;

        if (!channel) {
            return res.status(400).json({
                error: {
                    code: "BAD_REQUEST",
                    message: "Channel is required in request body",
                },
            });
        }

        const result = await channelAuthPort.authenticate({
            channel,
            token,
        });

        if (!result.authenticated) {
            return res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Invalid or missing gateway token",
                },
                meta: {
                    requestId: req.body?.metadata?.requestId,
                },
            });
        }

        // Injetar contexto de autenticação no objeto de request
        (req as any).gatewayAuth = {
            authenticated: true,
            clientId: result.clientId,
            scopes: result.scopes ?? [],
        };

        next();
    };
}

function extractBearerToken(header?: string): string | undefined {
    if (!header) return undefined;
    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return undefined;
    return parts[1];
}
