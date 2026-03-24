# MVP11 — Planner Engine + Agent Handoff Protocol

**Status:** 🔜 Planejado (iniciar após conclusão do MVP10)
**Pré-requisito:** MVP10 ✅

---

## Objetivo

Tornar o Andromeda capaz de decompor tarefas complexas em subtarefas coordenadas entre múltiplos agentes, com rastreabilidade completa de cada handoff.

---

## Blocos

### Bloco A — ExecutionPlan & TaskGraph
- `ExecutionPlan` como entidade formal com etapas, dependências e estado
- `PlannerAgent` — agente especialista em decompor tarefas complexas
- `TaskGraph` — DAG de subtarefas com dependências e status
- Orquestração sequencial e paralela
- Rollback de plano parcialmente executado
- Locking de nó em execução (evitar race conditions)

### Bloco B — Agent Handoff Protocol
- `HandoffPayload` — contrato formal: task parcial + memória relevante + resultado intermediário + instruções de continuação
- Rastreabilidade completa da cadeia de handoffs
- Aprovação humana opcional em pontos críticos

---

## Entidades novas (Prisma)
- `ExecutionPlan`
- `TaskGraphNode`
- `HandoffRecord`
- `HandoffPayload`

---

## Referências arquiteturais
- Agent Teams (Anthropic) — referência de UX para inbox entre agentes
- File locking para race conditions no TaskGraph
- PlannerAgent como camada separada (meta/planejamento/execução)
