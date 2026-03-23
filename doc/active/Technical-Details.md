# Technical Details — MVP09

## Stack Real (verificada em 2026-03-19)

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Express + TypeScript | express ^4.18.2 |
| ORM | Prisma | ^7.5.0 |
| Banco | PostgreSQL | via Docker |
| Realtime | Socket.io | ^4.8.3 |
| Filas | BullMQ | **instalar** (não está no package.json) |
| Frontend | React + Vite + Tailwind | apps/web/ |
| Cognitivo | Python 3.13 + FastAPI | services/cognitive-python/ |
| Testes | Vitest | por workspace |
| HTTP Utils | helmet, cors, morgan | já instalados |

## Estrutura Monorepo

```
Andromeda-SO/
├── CLAUDE.md                        ← Constituição do agente (raiz)
├── AGENTS.md                        ← Config de agentes do Antigravity
├── package.json                     ← Workspace root
├── apps/
│   └── web/                         ← React + Vite + Tailwind
├── packages/
│   ├── api/                         ← Backend Express (módulos aqui)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        ← Schema atual (MVP01→MVP08)
│   │   │   └── migrations/          ← 4 migrations existentes
│   │   └── src/
│   │       ├── app.ts               ← Express app config
│   │       ├── index.ts             ← Entry point
│   │       ├── modules/             ← Módulos de domínio
│   │       ├── infrastructure/      ← Adapters, repositories
│   │       ├── presentation/        ← Routes e controllers legados
│   │       └── shared/              ← Middlewares, utils, DTOs
│   ├── core/                        ← Contratos e domínio compartilhado
│   └── telegram/                    ← Canal Telegram (já implementado)
├── services/
│   └── cognitive-python/            ← FastAPI + RAG + embeddings
│       ├── app/main.py
│       ├── contracts/               ← Pydantic schemas
│       └── services/                ← rag, documents, planner, benchmark
└── .agent/
    ├── agents/                      ← 20 agentes especializados
    ├── skills/                      ← 60+ skills
    ├── rules/                       ← 14 rules obrigatórias
    └── workflows/                   ← 17 workflows + review-mvp09.md (novo)
```

## Schema Prisma Atual (pós-MVP08)

Modelos existentes:
- SandboxProfile, AgentSandboxConfig, SandboxExecution, SandboxArtifact
- ApprovalRequest
- MemoryEntry, MemoryLink, MemoryRetrievalRecord, MemoryPolicy
- KnowledgeCollection, KnowledgeDocument, KnowledgeChunk
- RetrievalRecord, AgentKnowledgePolicy
- CommunicationSession, CommunicationMessage

**Modelos a adicionar no MVP09:**
- User, RefreshToken, ApiKey (Fase 1 — Auth)
- AuditLog (Fase 1 — Auth audit)
- Adicionar tenantId em modelos existentes (Fase 2)
- HealthCheckRecord (Fase 8 — opcional)

## Padrão de Módulo (Express — NÃO NestJS)

```typescript
// packages/api/src/modules/auth/
├── application/
│   └── use-cases/
│       ├── LoginUseCase.ts
│       ├── RefreshTokenUseCase.ts
│       └── RevokeTokenUseCase.ts
├── domain/
│   ├── user.ts
│   ├── ports.ts          ← interfaces IUserRepository, ITokenRepository
│   └── types.ts
├── infrastructure/
│   └── persistence/
│       ├── PrismaUserRepository.ts
│       └── PrismaTokenRepository.ts
├── interfaces/
│   └── http/
│       ├── auth.routes.ts
│       └── auth.controller.ts
└── dependencies.ts       ← wire-up (instância de use cases com repos)
```

## Exemplo: Middleware Auth (Express)

```typescript
// packages/api/src/shared/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: string; role: string; tenantId: string }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const token = header.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = { id: payload.sub, role: payload.role, tenantId: payload.tenantId }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
```

## Exemplo: RBAC Middleware (Express)

```typescript
// packages/api/src/shared/middleware/rbac.middleware.ts
const ROLE_HIERARCHY = { owner: 4, admin: 3, operator: 2, viewer: 1 }

export function requireRole(minRole: keyof typeof ROLE_HIERARCHY) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userLevel = ROLE_HIERARCHY[req.user?.role as keyof typeof ROLE_HIERARCHY] ?? 0
    const minLevel = ROLE_HIERARCHY[minRole]
    if (userLevel < minLevel) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
```

## Exemplo: Registro de Rota com Auth

```typescript
// packages/api/src/modules/agents/interfaces/http/agent-management.routes.ts
import { Router } from 'express'
import { authMiddleware } from '../../../../shared/middleware/auth.middleware'
import { requireRole } from '../../../../shared/middleware/rbac.middleware'

const router = Router()

router.get('/', authMiddleware, (req, res) => { /* list agents */ })
router.post('/', authMiddleware, requireRole('admin'), (req, res) => { /* create */ })
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => { /* delete */ })

export default router
```

## Exemplo: Migration Prisma Incremental

```sql
-- packages/api/prisma/migrations/20260320000000_auth_iam/migration.sql

-- Fase 1: Adicionar tabelas de auth
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'viewer',
  "tenantId" TEXT NOT NULL DEFAULT 'default',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "refresh_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);
```

## Exemplo: BullMQ DLQ (Fase 6)

```typescript
// packages/api/src/modules/dlq/infrastructure/dlq.worker.ts
import { Worker, Queue } from 'bullmq'
import { redisConnection } from '../../shared/redis'

export const mainQueue = new Queue('andromeda-tasks', { connection: redisConnection })

export const worker = new Worker('andromeda-tasks', async (job) => {
  // processamento do job
}, {
  connection: redisConnection,
  settings: {
    backoffStrategy: (attemptsMade) => Math.min(1000 * 2 ** attemptsMade, 30000)
  }
})

worker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    await dlqQueue.add('failed', { originalJob: job.data, error: err.message })
  }
})

export const dlqQueue = new Queue('andromeda-dlq', { connection: redisConnection })
```

## Variáveis de Ambiente Necessárias (MVP09)

```env
# .env.development
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://andromeda:andromeda@localhost:5433/andromeda_dev
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=dev-secret-mude-em-producao
JWT_ACCESS_EXPIRES=7d        # 15m em produção
JWT_REFRESH_EXPIRES=30d      # 7d em produção
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=5

# Cognitive Python
COGNITIVE_PYTHON_URL=http://127.0.0.1:8008
COGNITIVE_PYTHON_TOKEN=dev-token
```

## Dependências a Instalar no MVP09

```bash
# packages/api/
npm install bullmq ioredis jsonwebtoken bcrypt express-rate-limit
npm install -D @types/jsonwebtoken @types/bcrypt

# Opcional para circuit breaker
npm install opossum
npm install -D @types/opossum
```
