---
description: Executar uma auditoria de segurança focada em uma aplicação web, do escopo à validação da correção
---

# Auditoria de Segurança para Aplicação Web

Vou te ajudar a revisar a segurança da sua aplicação web com foco em achados de alto impacto e validação de mitigação.

## Guardrails
- Só execute testes com autorização explícita
- Defina claramente o escopo antes de testar
- Priorize falhas de auth, autorização, API e injeção
- Converta achados em correções verificáveis
- Nunca declare mitigação sem evidência

## Pré-requisitos
- Autorização explícita para a auditoria
- Alvos em escopo documentados
- Logs e detalhes de ambiente disponíveis

## Etapas

### 1. Definir escopo e modelo de ameaça
Objetivo:
- Identificar ativos críticos, fronteiras de confiança e caminhos de ataque

Skills a usar:
- @ethical-hacking-methodology
- @threat-modeling-expert
- @attack-tree-construction

Entregáveis:
- ativos críticos
- trust boundaries
- ameaças prioritárias

### 2. Revisar autenticação e controle de acesso
Objetivo:
- Detectar takeover de conta e falhas de autorização

Skills a usar:
- @broken-authentication
- @auth-implementation-patterns
- @idor-testing

Entregáveis:
- análise de login, sessão e permissões
- verificação de acesso indevido
- riscos de multi-tenant

### 3. Avaliar API e segurança de inputs
Objetivo:
- Encontrar vulnerabilidades de alto impacto em APIs e entrada de dados

Skills a usar:
- @api-security-best-practices
- @api-fuzzing-bug-bounty
- @top-web-vulnerabilities

Entregáveis:
- lista de endpoints críticos
- riscos de injeção
- exposição indevida de dados
- fragilidades de validação

### 4. Corrigir e verificar
Objetivo:
- Transformar achados em correções e provar que a mitigação funcionou

Skills a usar:
- @security-auditor
- @sast-configuration
- @verification-before-completion

Entregáveis:
- plano de remediação
- correções aplicadas
- evidência de validação

## Princípios
- Comece por superfícies de maior impacto
- Explique risco, exploração e mitigação
- Validação final é obrigatória
