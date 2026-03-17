# Clean Architecture

## Objetivo
Separar interface, lógica de negócio e infraestrutura.

## Regras
- Rotas/controladores validam entrada e delegam.
- Regras de negócio ficam em services/use-cases.
- Acesso a dados deve ser centralizado.
- Evite duplicação de lógica.

## Bloqueios
- Não coloque regra de negócio complexa em controller/router/component.
