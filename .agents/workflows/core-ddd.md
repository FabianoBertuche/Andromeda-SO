---
description: Modelar um domínio central com DDD e aplicar padrões táticos e orientados a eventos apenas quando fizer sentido
---

# Núcleo de Domínio em DDD

Vou te ajudar a avaliar se DDD faz sentido, modelar o domínio e aplicar padrões táticos e event-driven só quando a complexidade justificar.

## Guardrails
- Não use DDD por moda; use quando houver complexidade real de domínio
- Prefira linguagem ubíqua e fronteiras claras
- Introduza CQRS, event store e sagas apenas quando necessário
- Preserve invariantes do domínio acima de conveniências de implementação

## Pré-requisitos
- Acesso a especialista de domínio ou proxy do produto
- Contexto do sistema atual e integrações disponíveis
- Alinhamento sobre objetivos de negócio e resultados esperados

## Etapas

### 1. Avaliar aderência de DDD e escopo
Objetivo:
- Decidir entre DDD completo, parcial ou arquitetura modular simples

Skills a usar:
- @domain-driven-design
- @architecture-decision-records

Entregáveis:
- decisão arquitetural
- justificativa
- escopo do domínio

### 2. Criar modelo estratégico
Objetivo:
- Definir subdomínios, bounded contexts e linguagem ubíqua

Skills a usar:
- @ddd-strategic-design

Entregáveis:
- subdomínios
- bounded contexts
- ownership

### 3. Mapear relações entre contextos
Objetivo:
- Definir contratos upstream/downstream e fronteiras de anticorrupção

Skills a usar:
- @ddd-context-mapping

Entregáveis:
- context map
- contratos
- pontos de integração

### 4. Implementar modelo tático
Objetivo:
- Codificar invariantes com aggregates, value objects e domain events

Skills a usar:
- @ddd-tactical-patterns
- @test-driven-development

Entregáveis:
- aggregates
- value objects
- invariantes cobertas por testes

### 5. Adotar padrões orientados a eventos seletivamente
Objetivo:
- Aplicar CQRS, event store, projections e sagas apenas onde a escala ou complexidade exigir

Skills a usar:
- @cqrs-implementation
- @event-store-design
- @projection-patterns
- @saga-orchestration

Entregáveis:
- decisão sobre evented patterns
- desenho da leitura/escrita
- orquestração de processos longos quando necessário

## Princípios
- Complexidade do domínio deve guiar a arquitetura
- DDD é ferramenta, não dogma
- Event-driven entra para resolver problema real
