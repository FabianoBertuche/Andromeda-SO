import { Agent } from "./Agent";

export interface AgentRegistry {
    register(agent: Agent): Promise<void>;
    findById(id: string): Promise<Agent | null>;
    findByName(name: string): Promise<Agent | null>;
    listAll(): Promise<Agent[]>;
    getDefaultAgent(): Promise<Agent>;
}
