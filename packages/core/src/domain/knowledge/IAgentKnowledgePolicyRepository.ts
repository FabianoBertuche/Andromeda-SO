import { AgentKnowledgePolicy } from "./types";

export interface IAgentKnowledgePolicyRepository {
    getPolicyByAgent(agentId: string): Promise<AgentKnowledgePolicy | null>;
    upsertPolicy(agentId: string, data: Partial<AgentKnowledgePolicy>): Promise<AgentKnowledgePolicy>;
    deletePolicy(agentId: string): Promise<void>;
}
