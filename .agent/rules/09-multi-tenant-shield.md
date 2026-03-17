# Multi-Tenant Shield

## Objetivo
Impedir vazamento entre tenants/empresas/contas.

## Regras
- Toda query multi-tenant deve filtrar por escopo autorizado.
- Nunca confie no tenant vindo livremente do client.
- O escopo deve vir da sessão/contexto autenticado.
