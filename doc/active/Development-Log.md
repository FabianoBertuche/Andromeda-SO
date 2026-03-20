# Development Log — Andromeda OS

> ⚠️ Append-only. Nunca editar entradas passadas. Só adicionar no final.

---

## [2026-03-19] — Sessão de Design e Revisão Completa

**Participantes:** Human + AI (Perplexity)

**O que foi feito:**
- Revisão visual do Agent Console em produção (MVP06 implementado no Antigravity)
- Identificação de 3 gaps de implementação (registrados no Notion)
- Mapeamento completo de 15 lacunas estruturais do sistema
- Design de 8 features novas (Agent Templates, LLM Benchmarking, Skill Security Audit,
  Skills Dashboard, User Profiling) — formalizadas no Notion como MVP08B
- Elaboração do roadmap expandido MVP09→MVP19
- Decisão de reorganizar /doc conforme estrutura Vibe Code
- Geração da documentação padrão Vibe Code para MVP09

**Decisões arquiteturais tomadas:**
1. Multi-tenancy via `tenantId` em todas as entidades (não schema-per-tenant)
2. Auth: JWT access (15m) + refresh token (7d) em DB — não stateless puro
3. Circuit breaker com Opossum (not custom) para providers LLM
4. DLQ como extensão do BullMQ existente — não novo sistema de filas
5. Soft delete universal com `deletedAt` + `archivedAt` separados
6. CI/CD: GitHub Actions com aprovação manual para produção

**Gaps identificados e mapeados:**
- Gap #1: `skill-first routing` deve ser ON por padrão (Bloco Safeguards)
- Gap #2: Sliders abaixo do min conformance sem feedback visual (Behavior Tab UX)
- Gap #3: `Conformance: n/a` sem tooltip em agentes novos (Identity UX minor)

**MVP08 marcado como ✅ implementado.**
**MVP09 iniciado — documentação Vibe Code gerada.**

---

## [próxima sessão] — MVP09 Fase 1: Auth Module

**Status:** ⏳ Aguardando

