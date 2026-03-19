import { AgentRegistry, ExecutionResult, ExecutionStrategy, IProviderAdapter, Provider, Task } from "@andromeda/core";
import { CognitiveRoutingSignalService } from "../../modules/cognitive/application/CognitiveRoutingSignalService";
import { cognitiveRoutingSignalService } from "../../modules/cognitive/dependencies";
import { AgentRuntimeOrchestrator } from "../../modules/agent-management/application/AgentRuntimeOrchestrator";
import { agentRuntimeOrchestrator } from "../../modules/agent-management/dependencies";
import { MemoryService } from "../../modules/memory/application/MemoryService";
import { memoryService } from "../../modules/memory/dependencies";
import { routeTaskUseCase } from "../../modules/model-center/dependencies";
import { OllamaProviderAdapter } from "../adapters/providers/OllamaProviderAdapter";
import { globalModelRepository, globalProviderRepository } from "../repositories/GlobalRepositories";

export class LLMExecutionStrategy implements ExecutionStrategy {
    private readonly ollamaAdapter: IProviderAdapter;

    constructor(
        private readonly agentRegistry: AgentRegistry,
        private readonly routingSignalService: CognitiveRoutingSignalService = cognitiveRoutingSignalService,
        providerAdapter?: IProviderAdapter,
        private readonly runtimeOrchestrator: AgentRuntimeOrchestrator = agentRuntimeOrchestrator,
        private readonly memoryLayer: MemoryService = memoryService,
    ) {
        this.ollamaAdapter = providerAdapter || new OllamaProviderAdapter();
    }

    async execute(task: Task): Promise<ExecutionResult> {
        try {
            const prepared = await this.runtimeOrchestrator.prepareExecution(task);
            if (!prepared.precheck.allowed) {
                const blocked = this.runtimeOrchestrator.buildBlockedResponse(prepared);
                return {
                    success: true,
                    data: {
                        content: blocked.content,
                        model: "safeguard:fallback",
                        agent: blocked.agent,
                        audit: blocked.audit,
                        behaviorSnapshot: prepared.assembly.behaviorSnapshot,
                    },
                    strategyUsed: this.getIdentifier(),
                };
            }

            const { modelName, provider } = await this.resolveTarget(task);
            const response = await this.ollamaAdapter.chat(provider, {
                model: modelName,
                messages: [
                    { role: "system", content: prepared.assembly.systemPrompt },
                    { role: "user", content: task.getRawRequest() },
                ],
                stream: false,
            });
            const finalized = this.runtimeOrchestrator.finalizeExecution({
                task,
                prepared,
                responseText: response.message?.content || response.response || "Sem resposta do modelo.",
                modelName,
            });
            const resultData = {
                content: finalized.content,
                model: modelName,
                agent: finalized.agent,
                audit: finalized.audit,
                behaviorSnapshot: prepared.assembly.behaviorSnapshot,
                usage: response.usage || {
                    prompt_tokens: response.prompt_eval_count,
                    completion_tokens: response.eval_count,
                },
            };
            task.setResult(resultData);
            task.setAuditParecer(finalized.audit);
            await this.memoryLayer.registerExecutionMemory(task).catch((error) => {
                console.warn("[memory.execution.record.failed]", {
                    taskId: task.getId(),
                    error: error instanceof Error ? error.message : "unknown_error",
                });
            });

            return {
                success: true,
                data: resultData,
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

        const targetAgentId = typeof metadata.targetAgentId === "string" && metadata.targetAgentId.trim().length > 0
            ? metadata.targetAgentId.trim()
            : undefined;

        if (targetAgentId) {
            const selectedAgent = await this.agentRegistry.findById(targetAgentId);
            if (selectedAgent && selectedAgent.getModel() && selectedAgent.getModel() !== "automatic-router") {
                return {
                    modelName: selectedAgent.getModel(),
                    provider: await this.ensureDefaultProvider(),
                };
            }
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
            const routing = await this.routingSignalService.resolve(task);
            console.info("[routing.signal.selected]", {
                taskId: task.getId(),
                source: routing.source,
                activityType: routing.activityType,
                warnings: routing.warnings,
            });

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
        } catch (error) {
            console.warn("[routing.model-center.fallback]", {
                taskId: task.getId(),
                error: error instanceof Error ? error.message : "unknown_error",
            });
            return null;
        }
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
