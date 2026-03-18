import { Task, ExecutionStrategy, ExecutionResult, AgentRegistry, IProviderAdapter } from "@andromeda/core";
import { OllamaProviderAdapter } from "../adapters/providers/OllamaProviderAdapter";
import { globalProviderRepository } from "../repositories/GlobalRepositories";

export class LLMExecutionStrategy implements ExecutionStrategy {
    private ollamaAdapter: IProviderAdapter;

    constructor(private readonly agentRegistry: AgentRegistry) {
        this.ollamaAdapter = new OllamaProviderAdapter();
    }

    async execute(task: Task): Promise<ExecutionResult> {
        try {
            const metadata = task.getMetadata();

            // 1. Determina qual modelo usar (prioridade para seleção manual no console)
            let modelName: string;
            let providerId: string = "ollama-local-id"; // Default para MVP

            if (metadata.modelId) {
                modelName = metadata.modelId;
            } else {
                const agent = await this.agentRegistry.getDefaultAgent();
                modelName = agent.getModel();
            }

            // 2. Busca o provedor (Ollama por padrão)
            const providers = await globalProviderRepository.findAll();
            const provider = providers.find(p => p.getType() === "ollama") || providers[0];

            if (!provider) throw new Error("Nenhum provedor de modelos configurado.");

            // 3. Chama o adaptador real do Ollama
            const response = await this.ollamaAdapter.chat(provider, {
                model: modelName,
                messages: [{ role: "user", content: task.getRawRequest() }],
                stream: false
            });

            return {
                success: true,
                data: {
                    content: response.message?.content || response.response || "Sem resposta do modelo.",
                    model: modelName,
                    usage: response.usage || { prompt_tokens: response.prompt_eval_count, completion_tokens: response.eval_count }
                },
                strategyUsed: this.getIdentifier(),
            };
        } catch (error: any) {
            return {
                success: false,
                data: null,
                strategyUsed: this.getIdentifier(),
                error: error.message,
            };
        }
    }

    getIdentifier(): string {
        return "llm-agent-strategy-v1";
    }
}
