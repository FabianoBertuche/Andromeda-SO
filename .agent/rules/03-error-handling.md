# Error Handling With Context

## Objetivo
Garantir erros observáveis, úteis e seguros.

## Regras
- Nunca engula exceções silenciosamente.
- Erros devem ter contexto suficiente para debugging.
- Mensagens ao usuário devem ser claras e não vazar detalhes sensíveis.
- Valide cedo e falhe cedo.

## Bloqueios
- Proibido `except: pass`, `catch {}` vazio ou equivalente.
