# Arquivo de logs

Este diretório concentra logs e erros históricos que estavam espalhados pelo repositório.

Estrutura atual:
- `root/` para logs de execuções na raiz do monorepo
- `apps/web/` para logs da interface web
- `packages/api/` para erros e saídas de build/TypeScript da API
- `services/cognitive-python/` para logs do bridge Python

Convenções de nomes:
- `dev.*` para execuções de desenvolvimento
- `mvp05.*` para execuções de diagnóstico do MVP05
- `build.error.txt` para falhas de build da UI
- `runtime.error.txt` para erros de execução da API
- `tsc.errors.txt` para erros do TypeScript da API

Os arquivos aqui são artefatos de diagnóstico e não fazem parte do código-fonte ativo.
