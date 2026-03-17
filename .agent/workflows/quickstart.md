# Quickstart

## Objetivo
Escolher o workflow correto para a tarefa.

## Passos
1. Detectar stack com `andromeda-stack-detector`.
2. Classificar tarefa:
   - feature nova
   - bugfix
   - refactor
   - análise de legado
   - mudança arquitetural
3. Mapear rules aplicáveis.
4. Escolher workflow:
   - feature grande -> `genesis`
   - mudança em código existente -> `probe`
   - dúvida estrutural ou alto risco -> `challenge`
   - implementação aprovada -> `execute-feature`
   - correção -> `bugfix`
   - melhoria interna -> `refactor`
