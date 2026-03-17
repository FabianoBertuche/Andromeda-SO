---
description: Projetar e entregar um sistema de agente de IA com confiabilidade mensurável
---

# Sistema de Agente de IA

Vou te ajudar a desenhar, implementar e avaliar um agente de IA com foco em confiabilidade, recuperação e iteração contínua.

## Guardrails
- Comece por um caso de uso estreito e mensurável
- Defina KPIs antes da implementação
- Separe claramente orquestração, retrieval, memória e avaliação
- Evite magia implícita quando comportamento determinístico for melhor
- Itere com base em falhas observadas

## Pré-requisitos
- Caso de uso com resultado mensurável
- Acesso a provedores de modelo e observabilidade
- Dataset inicial ou base de conhecimento disponível

## Etapas

### 1. Definir comportamento-alvo e KPIs
Objetivo:
- Estabelecer qualidade, latência e limites de falha

Skills a usar:
- @ai-agents-architect
- @agent-evaluation
- @product-manager-toolkit

Entregáveis:
- objetivos do agente
- KPIs
- critérios de sucesso e falha

### 2. Projetar retrieval e memória
Objetivo:
- Construir arquitetura de contexto e recuperação confiável

Skills a usar:
- @llm-app-patterns
- @rag-implementation
- @vector-database-engineer

Entregáveis:
- estratégia de chunking
- embeddings
- retrieval
- memória e contexto

### 3. Implementar orquestração
Objetivo:
- Implementar orquestração previsível, ferramentas e limites claros

Skills a usar:
- @langgraph
- @mcp-builder
- @workflow-automation

Entregáveis:
- grafo de execução
- tool boundaries
- fallback
- human-in-the-loop quando necessário

### 4. Avaliar e iterar
Objetivo:
- Melhorar fraquezas com um loop estruturado

Skills a usar:
- @agent-evaluation
- @langfuse
- @kaizen

Entregáveis:
- benchmark inicial
- failure modes
- priorização de correções
- nova rodada de validação

## Princípios
- O agente precisa ser observável
- Falhas devem virar insumo de melhoria
- Confiabilidade é requisito, não bônus
