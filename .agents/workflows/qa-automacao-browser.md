---
description: Criar automação de navegador resiliente com execução determinística em CI
---

# QA e Automação de Navegador

Vou te ajudar a definir estratégia, implementar testes E2E e endurecer a suíte para rodar de forma confiável no CI.

## Guardrails
- Detecte a stack de testes antes de escrever novos testes
- Teste fluxos do usuário, não detalhes de implementação
- Evite flakiness com waits corretos e dados controlados
- Endureça a suíte antes de marcar como pronta

## Pré-requisitos
- Ambientes de teste e credenciais estáveis
- Jornadas críticas identificadas
- Pipeline de CI disponível

## Etapas

### 1. Preparar estratégia de testes
Objetivo:
- Definir jornadas, fixtures e ambientes de execução

Skills a usar:
- @e2e-testing-patterns
- @test-driven-development

Entregáveis:
- suíte E2E mínima
- cenários prioritários
- estratégia de dados

### 2. Implementar testes de navegador
Objetivo:
- Construir cobertura robusta com seletores estáveis

Skills a usar:
- @browser-automation
- @go-playwright (opcional para stack Go)

Entregáveis:
- testes dos fluxos críticos
- waits confiáveis
- seletores estáveis

### 3. Triar e endurecer
Objetivo:
- Remover flakiness e garantir repetibilidade

Skills a usar:
- @systematic-debugging
- @test-fixing
- @verification-before-completion

Entregáveis:
- classificação das falhas
- correção de flakiness
- validação em CI

## Princípios
- Faça o teste refletir o comportamento do usuário
- Prefira determinismo a cobertura inflada
- Falha intermitente é bug do sistema de testes
