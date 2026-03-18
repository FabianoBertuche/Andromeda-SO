import { AgentRegistry, ExecuteSkill, ExecuteTask, ExecutionStrategyFactory, TaskRepository, globalEventBus } from "@andromeda/core";
import { globalSkillRegistry } from "../../presentation/routes/skillRoutes";
import { SkillExecutionStrategy } from "./SkillExecutionStrategy";
import { LLMExecutionStrategy } from "./LLMExecutionStrategy";

export function createDefaultExecutionFactory(agentRegistry: AgentRegistry): ExecutionStrategyFactory {
    const executeSkill = new ExecuteSkill();
    const skillStrategy = new SkillExecutionStrategy(globalSkillRegistry, executeSkill);
    const llmStrategy = new LLMExecutionStrategy(agentRegistry);
    const factory = new ExecutionStrategyFactory();

    factory.register("skill", skillStrategy);
    factory.register("llm", llmStrategy);

    return factory;
}

export function createDefaultExecuteTaskUseCase(
    taskRepository: TaskRepository,
    agentRegistry: AgentRegistry,
): ExecuteTask {
    return new ExecuteTask(taskRepository, createDefaultExecutionFactory(agentRegistry), globalEventBus);
}
