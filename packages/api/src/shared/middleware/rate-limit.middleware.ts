import rateLimit from "express-rate-limit";

// Limite global para a maioria das rotas v1
export const globalRateLimiter = rateLimit({
    windowMs: 1000, // 1 segundo
    max: 10, // limite de 10 requests por segundo por IP
    message: { error: "Too many requests, please slow down." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Limite restrito para rotas de autenticação
export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 requests por minuto por IP
    message: { error: "Too many login attempts, please try again after a minute" },
    standardHeaders: true,
    legacyHeaders: false,
});
