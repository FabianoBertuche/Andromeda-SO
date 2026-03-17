---
name: andromeda-architecture-guard
description: Impede mudanças estruturais sem análise explícita de impacto, escopo e aderência à arquitetura.
---

# Objetivo
Controlar deriva arquitetural.

# Instruções
1. Verifique se a mudança altera contratos, boundaries, módulos ou padrões centrais.
2. Se sim, exija design breve antes de implementar.
3. Prefira extensão do padrão atual em vez de reinventar estrutura.
4. Aponte trade-offs e riscos.

# Use quando
- nova feature grande
- refactor estrutural
- novo serviço
- mudança de autenticação, dados, env ou API
