# Project Context — Andromeda OS MVP09

## O Produto

Andromeda OS é um sistema operacional de agentes de IA rodando no Antigravity.
Usuário principal: desenvolvedor solo construindo via Vibe Code com LLMs.
O sistema executa tasks, roteia para modelos, usa memória e RAG, audita tudo.

## Estado Atual (pós-MVP08)

MVP08 entregou Knowledge Layer completo (RAG + Obsidian vault + Syncthing).
O sistema FUNCIONA mas está exposto: sem auth real, sem multi-tenancy, sem backup,
sem rate limiting, sem circuit breaker, sem DLQ formal, sem soft delete.

## Problema que o MVP09 resolve

Construir sofisticação cognitiva sobre fundação insegura = dívida técnica crítica.
Qualquer MVP10+ (Agent Evolution, Budget Control, Planner) precisa de:
- Autenticação real para proteger dados de usuário
- Multi-tenancy para isolar contextos futuros de workspaces
- API versionada para não quebrar integrações ao evoluir
- Rate limiting para não explodir custos com loops de agentes
- Backup para não perder memória/knowledge em crash

## Usuários e Contexto de Uso

- **Desenvolvedor (you):** usa via Web Console + ocasionalmente API direta
- **Agentes:** chamam APIs internas, precisam de rate limit e circuit breaker
- **Futuro:** múltiplos workspaces/usuários (multi-tenancy prepara isso)

## Restrições

- Monorepo existente: `apps/api`, `apps/web`, `services/cognitive-python`
- Prisma + PostgreSQL já em uso — migrations devem ser incrementais (sem drop)
- BullMQ já em uso para jobs — DLQ é extensão natural
- NestJS Guards existem — JWT é extensão do sistema de auth atual
- Deploy no Antigravity — CI/CD deve ser simples (GitHub Actions)

## Princípios que não mudam

- Skill antes de LLM sempre que possível
- Executor e auditor são entidades diferentes
- Python é camada cognitiva, TypeScript é control plane
- Deny-by-default no sandbox (já implementado, não regredir)
