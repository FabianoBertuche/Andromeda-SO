import { AgentRegistry, Capability, ExecutionResult, ExecutionStrategy, IProviderAdapter, Provider, Task } from "@andromeda/core";
import { routeTaskUseCase } from "../../modules/model-center/dependencies";
import { OllamaProviderAdapter } from "../adapters/providers/OllamaProviderAdapter";
import { globalModelRepository, globalProviderRepository } from "../repositories/GlobalRepositories";

export class LLMExecutionStrategy implements ExecutionStrategy {
    private readonly ollamaAdapter: IProviderAdapter;

    constructor(private readonly agentRegistry: AgentRegistry) {
        this.ollamaAdapter = new OllamaProviderAdapter();
    }

    async execute(task: Task): Promise<ExecutionResult> {
        try {
            const { modelName, provider } = await this.resolveTarget(task);
            const response = await this.ollamaAdapter.chat(provider, {
                model: modelName,
                messages: [{ role: "user", content: task.getRawRequest() }],
                stream: false,
            });

            return {
                success: true,
                data: {
                    content: response.message?.content || response.response || "Sem resposta do modelo.",
                    model: modelName,
                    usage: response.usage || {
                        prompt_tokens: response.prompt_eval_count,
                        completion_tokens: response.eval_count,
                    }
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

    private async resolveTarget(task: Task): Promise<{ modelName: string; provider: Provider }> {
        const metadata = task.getMetadata();
        const explicitModelId = typeof metadata.modelId === "string" && metadata.modelId.trim().length > 0
            ? metadata.modelId.trim()
            : undefined;

        if (explicitModelId) {
            const explicitModel = await globalModelRepository.findById(explicitModelId)
                || await globalModelRepository.findByExternalId(explicitModelId);

            if (explicitModel) {
                const provider = await globalProviderRepository.findById(explicitModel.getProviderId()) || await this.ensureDefaultProvider();
                return {
                    modelName: explicitModel.getExternalModelId(),
                    provider,
                };
            }

            return {
                modelName: explicitModelId,
                provider: await this.ensureDefaultProvider(),
            };
        }

        const routedTarget = await this.tryRouteTask(task);
        if (routedTarget) {
            return routedTarget;
        }

        const provider = await this.ensureDefaultProvider();
        const discoveredModels = await this.ollamaAdapter.listModels(provider);
        const firstDiscoveredModel = discoveredModels.find(model => typeof model.externalModelId === "string")?.externalModelId;

        if (firstDiscoveredModel) {
            return {
                modelName: firstDiscoveredModel,
                provider,
            };
        }

        const agent = await this.agentRegistry.getDefaultAgent();
        return {
            modelName: agent.getModel(),
            provider,
        };
    }

    private async tryRouteTask(task: Task): Promise<{ modelName: string; provider: Provider } | null> {
        try {
            const routing = this.inferRouting(task.getRawRequest());
            const decision = await routeTaskUseCase.execute({
                taskId: task.getId(),
                activityType: routing.activityType,
                requiredCapabilities: routing.requiredCapabilities,
            });

            const model = await globalModelRepository.findById(decision.getChosenModelId());
            if (!model) {
                return null;
            }

            const provider = await globalProviderRepository.findById(model.getProviderId()) || await this.ensureDefaultProvider();
            return {
                modelName: model.getExternalModelId(),
                provider,
            };
        } catch {
            return null;
        }
    }

    private inferRouting(rawRequest: string): { activityType: string; requiredCapabilities: Capability[] } {
        const normalized = rawRequest.toLowerCase();

        if (/(debug|stack trace|erro|fix bug|corrigir)/i.test(normalized)) {
            return { activityType: "coding.debug", requiredCapabilities: [Capability.CODING] };
        }
        if (/(arquitetura|architecture|refactor|design system)/i.test(normalized)) {
            return { activityType: "coding.architecture", requiredCapabilities: [Capability.ARCHITECTURE] };
        }
        if (/(traduz|translate|translation)/i.test(normalized)) {
            return { activityType: "translation", requiredCapabilities: [Capability.CHAT] };
        }
        if (/(resum|summary|summarize)/i.test(normalized)) {
            return { activityType: "chat.summarization", requiredCapabilities: [Capability.SUMMARIZATION] };
        }
        if (/(rag|retrieval|embedding|vector)/i.test(normalized)) {
            return { activityType: "rag.retrieval", requiredCapabilities: [Capability.RAG] };
        }
        if (/(imagem|image|vision|foto|screenshot)/i.test(normalized)) {
            return { activityType: "vision.general", requiredCapabilities: [Capability.VISION] };
        }
        if (/(audio|speech|transcri|stt|tts)/i.test(normalized)) {
            return { activityType: "audio.stt", requiredCapabilities: [Capability.AUDIO] };
        }
        if (/(código|code|function|typescript|python|javascript)/i.test(normalized)) {
            return { activityType: "coding.generate", requiredCapabilities: [Capability.CODING] };
        }

        return { activityType: "chat.general", requiredCapabilities: [Capability.CHAT] };
    }

    private async ensureDefaultProvider(): Promise<Provider> {
        const providers = await globalProviderRepository.findAll();
        const existing = providers.find(provider => provider.getType() === "ollama") || providers[0];
        if (existing) {
            return existing;
        }

        const provider = new Provider({
            name: "Ollama Local",
            type: "ollama",
            baseUrl: "http://localhost:11434",
            enabled: true,
            metadata: {
                locality: "local",
            }
        });

        await globalProviderRepository.save(provider);
        return provider;
    }
}
