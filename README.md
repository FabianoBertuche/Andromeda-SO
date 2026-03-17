# Andromeda OS - MVP v0.1

Bem-vindo ao Andromeda OS, o sistema operacional agentic projetado para ser "Skill-First".

## 🪐 Visão Geral
Este MVP implementa o núcleo do Andromeda, permitindo o gerenciamento de tarefas (Tasks), o registro de habilidades determinísticas (Skills) e o fallback inteligente para Agentes (IA).

### Arquitetura
O projeto utiliza uma arquitetura **Ports and Adapters** (Hexagonal) para garantir testabilidade e independência de infraestrutura.
- `packages/core`: Lógica de domínio e casos de uso.
- `packages/api`: Camada de entrega via Express, infraestrutura e motor de execução.

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js (v18+)
- npm

### Instalação
```bash
npm install
```

### Execução (Desenvolvimento)
O servidor iniciará na porta **5000** (ajustado para evitar conflitos comuns).
```bash
npm run dev --workspace=@andromeda/api
```

## 🛠️ Como Testar

### 1. Registrar uma Skill (Habilidade)
Envie um script Javascript que será executado em um sandbox seguro.
```powershell
Invoke-RestMethod -Uri http://localhost:5000/skills -Method Post -Headers @{"Content-Type"="application/json"} -Body '{
  "id": "calc-01",
  "name": "calculadora",
  "description": "soma",
  "type": "script",
  "code": "result = input.a + input.b;"
}'
```

### 2. Criar e Executar uma Task (Roteamento Skill-First)
Ao pedir uma soma, o motor identificará a skill acima.
```powershell
# Criar Task
$task = Invoke-RestMethod -Uri http://localhost:5000/tasks -Method Post -Headers @{"Content-Type"="application/json"} -Body '{
  "raw_request": "Use a calculadora para somar 10 e 20",
  "metadata": {"input": {"a": 10, "b": 20}}
}'

# Executar
Invoke-RestMethod -Uri http://localhost:5000/tasks/$($task.id)/execute -Method Post
```

### 3. Testar Fallback para Agente (LLM)
Se o pedido for genérico, o **Kernel Agent** assumirá a resposta.
```powershell
# Criar Task
$task = Invoke-RestMethod -Uri http://localhost:5000/tasks -Method Post -Headers @{"Content-Type"="application/json"} -Body '{
  "raw_request": "Qual é a sua missão?"
}'

# Executar
Invoke-RestMethod -Uri http://localhost:5000/tasks/$($task.id)/execute -Method Post
```

## 📋 Próximos Passos (V0.2)
- [ ] Integração real com OpenAI/Gemini API.
- [ ] Persistência de dados com Postgres/Supabase.
- [ ] Interface visual (Dashboard) em Next.js.
