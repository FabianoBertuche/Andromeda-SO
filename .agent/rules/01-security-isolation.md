# Security Isolation

## Objetivo
Evitar exposição de segredos, acessos privilegiados indevidos e escrita insegura no client.

## Aplique quando
- houver autenticação
- houver integração com banco
- houver rotas/API
- houver client-side com acesso a serviços

## Regras
- Nunca exponha secrets no frontend.
- Nunca use credenciais privilegiadas fora do servidor.
- Toda escrita sensível deve passar por backend validado.
- Toda identidade usada em operações críticas deve vir de sessão/autorização confiável.

## Bloqueios
- Rejeite alterações que usem chaves administrativas no client.
- Rejeite acesso direto inseguro a recursos protegidos.
