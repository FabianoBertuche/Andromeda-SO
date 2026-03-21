# Frontend / Backend Handoff Checklist

## Read first

- Open `FRONTEND_BACKEND_INTEGRATION_REPORT.md`

## Confirmed current state

- Frontend runs on `http://127.0.0.1:5173`
- API runs on `http://127.0.0.1:5000`
- `Gateway Online` can appear in UI
- Agents and models load from backend
- Chat task creation works
- Chat execution fails with `Timed out after 15000ms`
- Knowledge UI is not connected correctly to backend
- Agents detail requests can fail with `429 Too Many Requests`

## Main problems to fix

### 1. Knowledge disconnected

- Frontend uses `/api/knowledge/*`
- Vite proxy does not map `/api/knowledge`
- API app does not mount `knowledgeRouter`

Fix targets:

- `apps/web/vite.config.ts`
- `packages/api/src/app.ts`
- `apps/web/src/components/knowledge/KnowledgeView.tsx`

## 2. Chat/gateway timeout

- `POST /v1/gateway/message` succeeds
- task status later becomes `failed`
- error is `Timed out after 15000ms`

Fix targets:

- `packages/api/src/infrastructure/resilience/CircuitBreakerFactory.ts`
- `packages/api/src/infrastructure/adapters/providers/OllamaProviderAdapter.ts`
- `packages/api/src/infrastructure/execution/LLMExecutionStrategy.ts`

## 3. Agents screen hits rate limit

- many detail requests happen in parallel
- backend global rate limit is too low for this screen in dev

Fix targets:

- `packages/api/src/shared/middleware/rate-limit.middleware.ts`
- `apps/web/src/components/agents/AgentManagementView.tsx`

## Recommended order

1. Fix Knowledge routing/proxy
2. Fix chat timeout
3. Fix agent detail `429`
4. Rerun focused E2E

## Suggested concrete changes

### Knowledge

Add Vite proxy:

```ts
'/api/knowledge': {
  target: apiTarget,
  changeOrigin: true,
  rewrite: (p) => p.replace(/^\/api\/knowledge/, '/v1/knowledge'),
}
```

Mount router in API:

```ts
v1Router.use('/knowledge', authMiddleware, tenantMiddleware, knowledgeRouter);
```

## Chat timeout

Temporary mitigation:

```ts
timeout: config?.timeout || 45000
```

Then verify provider/model selection and execution timing.

## Rate limit

Temporary dev-only mitigation:

```ts
max: process.env.NODE_ENV === 'development' ? 100 : 10
```

Better long term: lazy load agent tabs instead of loading everything at once.

## Useful commands

```bash
node -e "fetch('http://127.0.0.1:5000/v1/agents',{headers:{Authorization:'Bearer andromeda_dev_web_token'}}).then(async r=>{console.log(r.status);console.log(await r.text())})"
```

```bash
node -e "fetch('http://127.0.0.1:5000/v1/model-center/models',{headers:{Authorization:'Bearer andromeda_dev_web_token'}}).then(async r=>{console.log(r.status);console.log(await r.text())})"
```

```bash
node -e "fetch('http://127.0.0.1:5000/v1/gateway/message',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer andromeda_dev_web_token'},body:JSON.stringify({channel:'web',session:{id:'session-manual'},content:{type:'text',text:'Reply with OK'},metadata:{activityType:'chat.general'}})}).then(async r=>{console.log(r.status);console.log(await r.text())})"
```

## E2E files already adjusted for investigation

- `apps/web/e2e/console-real.spec.ts`
- `apps/web/e2e/integration.spec.ts`
- `apps/web/e2e/homepage.spec.ts`

These may need cleanup after backend fixes are done.
