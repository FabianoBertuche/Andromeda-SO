import { Task } from "../../core/domain/task/Task";
import { ExecutionStrategy, ExecutionResult } from "../../core/domain/execution/ExecutionStrategy";
import { AgentRegistry } from "../../core/domain/agent/AgentRegistry";
import { MockLLMProvider } from "../llm/LLMProvider";

export class LLMExecutionStrategy implements ExecutionStrategy {
    private llmProvider: MockLLMProvider;

    constructor(private readonly agentRegistry: AgentRegistry) {
        this.llmProvider = new MockLLMProvider();
    }

    async execute(task: Task): Promise<ExecutionResult> {
        try {
            // 1. Obtém o agente para processar (Kernel Agent por padrão no MVP)
            const agent = await this.agentRegistry.getDefaultAgent();

            // 2. Chama o provedor de LLM
            const response = await this.llmProvider.generate({
                agent: agent,
                userPrompt: task.getRawRequest()
            });

            return {
                success: true,
                data: {
                    content: response.content,
                    agentId: agent.getId(),
                    usage: response.usage
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
