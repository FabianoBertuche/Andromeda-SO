Use o arquivo de referência abaixo como fonte canônica desta implementação:

`/doc/Andromeda_PRD_MVP02.md`

Sua tarefa é implementar o **MVP02 do Andromeda OS** com base estrita nesse documento.

## Instrução principal

Leia o arquivo `/doc/Andromeda_PRD_MVP02.md` por completo e siga fielmente sua arquitetura, contratos, limites e prioridades.

O objetivo deste ciclo é implementar a **camada de comunicação unificada** do Andromeda OS, tratando a interface web como apenas o primeiro canal de entrada do sistema.

## Regra arquitetural obrigatória

O frontend web **NÃO** deve falar diretamente com `/tasks` como API conversacional.

A nova entrada pública do sistema deve ser:

- `POST /gateway/message`

O sistema deve seguir o fluxo:

**web -> gateway -> task system -> execution -> auditoria -> resposta**

## O que implementar

Implementar exatamente o que estiver definido no PRD para o MVP02, incluindo no mínimo:

1. módulo `communication`
2. `Communication Gateway`
3. autenticação simples por token fixo por canal
4. canal inicial `web`
5. modelo `UnifiedMessage`
6. modelo `CommunicationSession`
7. integração com o task system atual por use case interno
8. `UnifiedResponse`
9. endpoints mínimos de sessão/leitura
10. base estrutural para websocket futuro

## Restrições obrigatórias

Não inventar arquitetura paralela.
Não simplificar o conceito central.
Não acoplar o frontend diretamente ao task system.
Não duplicar lógica do kernel dentro do gateway.
Não usar chamada HTTP interna para `/tasks`.
Não antecipar UI bonita, voz, multimodalidade pesada ou features fora do escopo definido no PRD.

## Prioridades absolutas

1. fidelidade ao documento `/doc/Andromeda_PRD_MVP02.md`
2. desacoplamento
3. extensibilidade futura
4. compatibilidade com Nebula
5. implementação pragmática sem overengineering

## Regras de implementação

- seguir Clean Architecture + Ports & Adapters
- manter controllers finos
- concentrar orquestração em use cases
- manter autenticação na borda
- tratar sessão como sessão operacional, não memória avançada
- preparar compatibilidade futura com:
  - Telegram
  - Discord
  - CLI
  - Mobile
  - Nebula

## Forma de execução

1. leia e interprete o arquivo `/doc/Andromeda_PRD_MVP02.md`
2. identifique a estrutura de pastas e contratos exigidos
3. implemente os arquivos necessários na ordem mais segura
4. preserve compatibilidade com o backend já existente
5. ao final, gere um resumo objetivo contendo:
   - arquivos criados
   - arquivos alterados
   - decisões relevantes tomadas
   - pontos pendentes, se houver

## Critério de sucesso

A implementação será considerada correta quando existir um fluxo funcional onde:

- uma interface web autenticada envia mensagem ao gateway
- o gateway normaliza a mensagem
- resolve/cria sessão
- converte em task via caso de uso interno
- aciona o kernel atual
- recebe o resultado
- devolve uma resposta unificada

## Instrução final

Se houver qualquer dúvida entre duas abordagens, escolha sempre a que:
- mantém o kernel limpo
- reduz acoplamento
- segue o PRD com mais fidelidade
- evita refatoração grande no futuro
- mantém o gateway como camada de borda e não como segundo kernel