# ADR - Architectural Decision Record

## Título
MVP05 - Fundação híbrida TypeScript + Python

## Status
Aceito

## Contexto
O Andromeda já possui kernel operacional em TypeScript para gateway, sessões, tasks, event bus, realtime, roteamento e auditoria. O MVP05 precisa introduzir a base da camada cognitiva em Python sem quebrar contratos públicos nem tornar o Python dependência obrigatória do fluxo principal.

## Problema
Capacidades cognitivas futuras como RAG, memória, evals, benchmark e planner pedem ecossistema Python, mas migrar o backend inteiro agora aumentaria risco de regressão e duplicaria governança operacional.

## Opções consideradas
1. Migrar o backend inteiro para Python.
2. Chamar Python diretamente de pontos ad hoc no Express.
3. Manter o kernel em TypeScript e introduzir Python por ports, adapters e contratos canônicos.

## Decisão
Foi adotada a opção 3.

- O kernel continua em TypeScript.
- O Python entra como serviço interno opcional `services/cognitive-python`.
- A integração usa contratos canônicos com `requestId`, `correlationId`, `taskId` e `sessionId`.
- O adapter TS aplica timeout, retry controlado, health/readiness e tratamento de erro padronizado.
- O primeiro uso funcional é um sinal cognitivo **não autoritativo** para classificação de task, com fallback imediato para a heurística legada quando o Python está indisponível.

## Consequências
- O sistema permanece operacional sem o serviço Python.
- O acoplamento entre runtime TS e runtime Python fica explícito e testável.
- O Python passa a ter um ponto de entrada estável para futuras capacidades cognitivas.

## Riscos
- Python ainda não está disponível neste ambiente, então a validação executada ficou restrita ao lado TypeScript e a testes unitários do adapter.
- O sinal cognitivo inicial usa heurística simples no serviço Python; ganhos reais de qualidade ficam para MVP06+.
- A observabilidade ainda usa logs básicos; tracing distribuído completo continua como trabalho futuro.
