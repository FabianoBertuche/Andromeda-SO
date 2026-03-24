# Implementation Plan — MVP12
**Zero-Shot Ready para Antigravity/Claude Code**  
**Estimativa:** 6–8 sessões de coding  
**Data:** 2026-03-24  

---

## Leia Antes de Começar

1. Leia `doc/active/Project-Context.md` — contexto geral do projeto
2. Leia `doc/active/MVP12-PRD.md` — requisitos completos
3. Leia `doc/active/EDD-MVP12.md` — arquitetura detalhada
4. Confirme: MVP01–MVP11 estão todos concluídos
5. Confirme: Python service (`services/cognitive-python`) está rodando em `:8000`
6. Confirme: `packages/api` está rodando em `:3000`

**Regra de ouro:** Ao final de cada fase, rode `npm run test` + `npm run typecheck`. Só avance com tudo verde. Faça commit com a convenção `feat(mvp12): fase N — descrição`.

---

## FASE 1 — Prisma Migrations + Entidades Base
**Estimativa:** 1h  
**Arquivos a criar/modificar:**

```
packages/api/prisma/schema.prisma              ALTERAR
packages/api/prisma/migrations/                GERAR
```

**O que fazer:**

1. Adicionar em `model Agent`:
   - `preferredLocale String? @default("pt-BR")`
   - `fallbackLocale  String? @default("en-US")`
   - `bundles AgentBundle[]`

2. Adicionar em `model KnowledgeDocument`:
   - `detectedLang    String?`
   - `detectedLocale  String?`
   - `langConfidence  Float?`

3. Criar models novos (copie do EDD-MVP12.md seção 4):
   - `LocaleRegistry`
   - `LocalizedMessage`
   - `UserPreferences`
   - `AgentBundle`
   - `AgentImportJob`
   - Enums: `AgentImportStatus`, `ConflictPolicy`

4. Rodar:
```bash
npx prisma migrate dev --name mvp12-i18n-portability
npx prisma generate
```

**Commit gate:** `npx prisma validate` sem erros.

---

## FASE 2 — i18n Backend (API)
**Estimativa:** 1.5h  
**Arquivos a criar:**

```
packages/api/src/modules/i18n/
  locale.routes.ts             NOVO
  locale.controller.ts         NOVO
  i18n.service.ts              NOVO
  repositories/
    localized-message.repository.ts   NOVO
    user-preferences.repository.ts    NOVO
  seeds/
    pt-BR.seed.ts              NOVO
    en-US.seed.ts              NOVO
```

**O que fazer:**

1. Criar `I18nService` com métodos:
   - `getMessage(key, locale)` → string com fallback para en-US
   - `listLocales()` → LocaleRegistry[]
   - `getMessagesByCategory(locale, category)` → LocalizedMessage[]
   - `getUserPreferences(userId)` → UserPreferences
   - `updateUserPreferences(userId, data)` → UserPreferences

2. Criar rotas:
   - `GET /v1/i18n/locales`
   - `GET /v1/i18n/messages?locale=pt-BR&category=system`
   - `PUT /v1/users/me/preferences`

3. Criar seeds com mensagens em PT-BR e EN-US para categorias:
   - `system`: task.created, task.failed, task.completed, agent.error.*
   - `notification`: budget.warning, budget.exceeded, health.degraded
   - `error`: validation.*, auth.*, rate_limit.*

4. Registrar módulo em `packages/api/src/app.ts`

**Commit gate:** `GET /v1/i18n/locales` retorna `[{code:"pt-BR",...},{code:"en-US",...}]`

---

## FASE 3 — Language Detection (Python)
**Estimativa:** 1h  
**Arquivos a criar/modificar:**

```
services/cognitive-python/requirements.txt          ALTERAR
services/cognitive-python/src/routers/language.py   NOVO
services/cognitive-python/src/routers/retrieval.py  ALTERAR
services/cognitive-python/src/main.py               ALTERAR
```

**O que fazer:**

1. Adicionar `langdetect>=1.0.9` em `requirements.txt`

2. Criar `language.py` (copie do EDD-MVP12.md seção 2.4):
   - `POST /language/detect` com `DetectRequest` e `DetectResponse`
   - Mapa `LANG_TO_LOCALE = {"pt": "pt-BR", "en": "en-US", ...}`
   - Fallback para `en-US` quando confiança < `min_confidence`

3. Alterar `retrieval.py`:
   - Adicionar campo opcional `lang_filter: Optional[str]` no request
   - Se presente: filtrar chunks por `detectedLang == lang_filter` antes do reranking

4. Registrar router em `main.py`: `app.include_router(language_router)`

5. Alterar `KnowledgeIngestService` no TypeScript:
   - Após salvar documento, chamar `POST http://localhost:8000/language/detect`
   - Persistir `detectedLang`, `detectedLocale`, `langConfidence` no documento

**Commit gate:** `curl -X POST localhost:8000/language/detect -d '{"text":"Olá mundo"}'` retorna `{"locale":"pt-BR","confidence":>0.8}`

---

## FASE 4 — Export de Agentes
**Estimativa:** 1.5h  
**Arquivos a criar:**

```
packages/api/src/modules/agent-portability/
  bundle.builder.ts            NOVO
  bundle.validator.ts          NOVO
  export.use-case.ts           NOVO
  export.controller.ts         NOVO
  export.routes.ts             NOVO
  repositories/
    agent-bundle.repository.ts NOVO
```

**O que fazer:**

1. Instalar dependências:
```bash
cd packages/api
npm install archiver @types/archiver
```

2. Criar `BundleBuilder` (copie do EDD-MVP12.md seção 3.1):
   - Método `build(agentId, options)` → `AgentBundleFile`
   - Gerar ZIP com estrutura do EDD
   - Calcular SHA-256 do arquivo gerado
   - Salvar em `./storage/bundles/`

3. Criar `ExportAgentUseCase`:
   - Verificar permissão RBAC (admin/owner only)
   - Chamar `BundleBuilder.build()`
   - Persistir `AgentBundle` no banco
   - Retornar `{ bundleId, downloadUrl }`

4. Criar rotas:
   - `POST /v1/agents/:id/export`
   - `GET /v1/agents/:id/bundles`
   - `GET /v1/agents/:id/bundles/:bundleId/download`

**Commit gate:** `POST /v1/agents/:id/export` retorna `{ bundleId, downloadUrl }` e arquivo `.andromeda-agent` é criado em `/storage/bundles/`

---

## FASE 5 — Import de Agentes
**Estimativa:** 2h  
**Arquivos a criar:**

```
packages/api/src/modules/agent-portability/
  bundle.validator.ts          NOVO (ou complementar Fase 4)
  bundle.importer.ts           NOVO
  import.use-case.ts           NOVO
  import.controller.ts         NOVO
  import.routes.ts             NOVO
  repositories/
    agent-import-job.repository.ts NOVO
```

**O que fazer:**

1. Instalar:
```bash
npm install unzipper multer @types/multer
```

2. Criar `BundleValidator` (copie do EDD-MVP12.md seção 3.2):
   - Verificar checksum SHA-256
   - Listar conteúdo do ZIP e checar arquivos obrigatórios
   - Validar `schemaVersion` contra `SUPPORTED_SCHEMA_VERSIONS = ['1.0']`

3. Criar `BundleImporter`:
   - Extrair ZIP em diretório temporário
   - Criar Agent com dados do bundle dentro de `$transaction`
   - Limpar diretório temporário após import
   - Suportar `overwrite: agentId?` para sobrescrever agente existente

4. Criar `ImportAgentUseCase` (copie do EDD-MVP12.md seção 3.3):
   - Pipeline: VALIDATING → CONFLICT_DETECTED? → IMPORTING → COMPLETED/FAILED
   - Transação atômica — rollback total em caso de erro
   - Aplicar `conflictPolicy`: ABORT, RENAME, OVERWRITE

5. Criar rotas:
   - `POST /v1/agents/import` (multipart/form-data)
   - `GET /v1/agents/import/:jobId`
   - `POST /v1/agents/import/:jobId/resolve` (resolve conflito)

**Commit gate:**
- Import de bundle válido → agente criado no banco
- Import de bundle corrompido → FAILED sem agente criado
- Import com slug duplicado + ABORT → CONFLICT_DETECTED, nada criado

---

## FASE 6 — UI: i18n Frontend
**Estimativa:** 1.5h  
**Arquivos a criar/modificar:**

```
apps/web/
  package.json                          ALTERAR (add i18next)
  src/i18n.ts                           NOVO
  src/main.tsx                          ALTERAR (add I18nextProvider)
  src/locales/pt-BR/common.json         NOVO
  src/locales/pt-BR/agents.json         NOVO
  src/locales/pt-BR/tasks.json          NOVO
  src/locales/pt-BR/errors.json         NOVO
  src/locales/en-US/common.json         NOVO
  src/locales/en-US/agents.json         NOVO
  src/locales/en-US/tasks.json          NOVO
  src/locales/en-US/errors.json         NOVO
  src/components/LocaleSwitcher.tsx     NOVO
  src/views/SettingsView.tsx            ALTERAR
```

**O que fazer:**

1. Instalar:
```bash
cd apps/web
npm install i18next react-i18next i18next-browser-languagedetector
```

2. Criar `src/i18n.ts` com configuração (copie do EDD-MVP12.md seção 2.2)

3. Criar arquivos JSON de tradução para PT-BR e EN-US com todas as strings visíveis na UI atual. Estratégia: percorra cada View e extraia strings hardcoded.

4. Substituir strings hardcoded por `t('key')` em todos os componentes (use `useTranslation` hook)

5. Criar `LocaleSwitcher` — dropdown no Header/Navbar com PT 🇧🇷 e EN 🇺🇸. Ao trocar, persiste no `localStorage` e chama `PUT /v1/users/me/preferences`.

6. Em `AgentEditView`, adicionar campos `preferredLocale` e `fallbackLocale` (select com locales disponíveis)

**Commit gate:** UI renderiza 100% em PT-BR por padrão; ao trocar para EN-US, todos os labels mudam sem reload.

---

## FASE 7 — UI: Export/Import de Agentes
**Estimativa:** 1.5h  
**Arquivos a criar/modificar:**

```
apps/web/src/
  components/
    AgentExportModal.tsx          NOVO
    AgentImportModal.tsx          NOVO
    ImportConflictDialog.tsx      NOVO
    ImportProgressBar.tsx         NOVO
  views/
    AgentManagementView.tsx       ALTERAR (add botões Export/Import)
    AgentEditView.tsx             ALTERAR (add botão Export)
  services/
    agent-portability.service.ts  NOVO
```

**O que fazer:**

1. `AgentExportModal`:
   - Checkbox "Incluir Knowledge Collections"
   - Checkbox "Incluir Histórico de Versões" (default: true)
   - Botão "Exportar" → chama `POST /v1/agents/:id/export` → download automático

2. `AgentImportModal`:
   - Drag & drop ou file picker para `.andromeda-agent`
   - Mostra progresso do `AgentImportJob` via polling `GET /v1/agents/import/:jobId`
   - Em `CONFLICT_DETECTED`: abre `ImportConflictDialog`

3. `ImportConflictDialog`:
   - Exibe nome do agente em conflito
   - Opções: Renomear / Substituir / Cancelar
   - Chama `POST /v1/agents/import/:jobId/resolve`

4. `AgentManagementView`:
   - Botão "Importar Agente" no header da listagem
   - Menu de contexto por agente: "Exportar"

**Commit gate:** Export gera download do arquivo; Import com conflito apresenta dialog; Import bem-sucedido aparece na listagem de agentes.

---

## FASE 8 — Testes E2E + Evals
**Estimativa:** 1h  
**Arquivos a criar:**

```
packages/api/tests/mvp12/
  i18n.test.ts                  NOVO
  export-import.test.ts         NOVO
doc/active/evals/
  mvp12-i18n.feature            NOVO
  mvp12-export-import.feature   NOVO
```

**O que fazer:**

1. Testes de integração para:
   - `GET /v1/i18n/locales` retorna PT-BR e EN-US
   - `GET /v1/i18n/messages?locale=pt-BR&category=system` retorna mensagens
   - Export → gera arquivo + persiste `AgentBundle` no banco
   - Import de bundle válido → cria agente
   - Import de bundle inválido (checksum errado) → FAILED
   - Import com conflito + ABORT → CONFLICT_DETECTED, nada criado
   - Import com conflito + OVERWRITE → agente substituído

2. Rodar evals BDD (copie os arquivos `.feature` gerados)

3. Atualizar `Development-Log.md`:
```
## 2026-03-24 — MVP12 Concluído
- i18n PT-BR/EN-US implementado em 3 camadas
- Language detection automático na ingestão de documentos
- Export/Import de agentes com bundle .andromeda-agent
- Transação atômica no import com 3 políticas de conflito
- CLI: andromeda agents export/import
```

**Commit gate final:** Todos os testes verdes. `npm run test` + `npm run typecheck` passam.

---

## Checklist Final MVP12

- [ ] Migration `mvp12-i18n-portability` aplicada
- [ ] `GET /v1/i18n/locales` funcional
- [ ] UI em PT-BR por padrão
- [ ] LocaleSwitcher alterna PT↔EN sem reload
- [ ] `preferredLocale` configurável por agente
- [ ] Language detection ativo na ingestão de documentos (Python)
- [ ] Retrieval filtra por idioma do agente
- [ ] Export gera `.andromeda-agent` com checksum SHA-256
- [ ] Import valida checksum antes de processar
- [ ] Import conflito: 3 políticas funcionando (ABORT/RENAME/OVERWRITE)
- [ ] Import atômico: falha não deixa agente parcial
- [ ] RBAC: apenas admin/owner exportam/importam
- [ ] CLI `andromeda agents export/import` funcional
- [ ] Todos os evals BDD verdes
- [ ] `Development-Log.md` atualizado
- [ ] `Project-Context.md` atualizado com MVP12 concluído
