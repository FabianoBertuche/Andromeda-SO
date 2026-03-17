---
description: Entregar um MVP SaaS com foco em produção, do escopo ao deploy
---

# MVP SaaS

Vou te ajudar a planejar, construir, testar e publicar um MVP SaaS com o menor atrito possível.

## Guardrails
- Defina claramente o problema do usuário e o escopo do MVP antes de codar
- Priorize o fluxo principal de valor e evite overengineering
- Siga os padrões já existentes no repositório
- Inclua testes mínimos para os caminhos críticos
- Prepare release com observabilidade e rollback

## Pré-requisitos
- Repositório local e ambiente configurados
- Problema do usuário e escopo inicial definidos
- Alvo básico de deploy escolhido

## Etapas

### 1. Planejar o escopo
Objetivo:
- Definir os limites do MVP e os critérios de aceite

Skills a usar:
- @brainstorming
- @concise-planning
- @writing-plans

Entregáveis:
- escopo do MVP
- milestones
- critérios de aceite

### 2. Construir backend e API
Objetivo:
- Implementar entidades principais, APIs e baseline de autenticação

Skills a usar:
- @backend-dev-guidelines
- @api-patterns
- @database-design

Entregáveis:
- modelo de dados
- endpoints principais
- autenticação básica
- validação de entrada

### 3. Construir frontend
Objetivo:
- Entregar o fluxo principal do usuário com estados de UX claros

Skills a usar:
- @frontend-developer
- @react-patterns
- @frontend-design

Entregáveis:
- onboarding inicial
- empty states
- dashboard inicial
- integração com API

### 4. Testar e validar
Objetivo:
- Cobrir os caminhos críticos antes do lançamento

Skills a usar:
- @test-driven-development
- @browser-automation
- @go-playwright (opcional para stack Go)

Entregáveis:
- testes de lógica
- testes de API
- testes E2E dos fluxos principais

### 5. Publicar com segurança
Objetivo:
- Fazer release com observabilidade e plano de rollback

Skills a usar:
- @deployment-procedures
- @observability-engineer

Entregáveis:
- checklist de release
- rollback plan
- verificações pós-deploy

## Princípios
- Construa verticalmente, entregando uma fatia funcional completa
- Faça o mínimo viável funcionar antes de polir
- Preserve evidências: plano, decisões, testes e validações
