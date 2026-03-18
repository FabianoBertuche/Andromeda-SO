import { RoutingDecision, IRoutingDecisionRepository } from "@andromeda/core";

export class InMemoryRoutingDecisionRepository implements IRoutingDecisionRepository {
    private decisions: Map<string, any> = new Map();

    async save(decision: RoutingDecision): Promise<void> {
        this.decisions.set(decision.getId(), decision.toJSON());
    }

    async findById(id: string): Promise<RoutingDecision | null> {
        const data = this.decisions.get(id);
        if (!data) return null;
        return new RoutingDecision(data);
    }

    async findByTaskId(taskId: string): Promise<RoutingDecision[]> {
        return Array.from(this.decisions.values())
            .filter(data => data.taskId === taskId)
            .map(data => new RoutingDecision(data));
    }

    async getRecentDecisions(limit: number): Promise<RoutingDecision[]> {
        const all = Array.from(this.decisions.values())
            .map(data => new RoutingDecision(data))
            .sort((a, b) => (b.toJSON().createdAt?.getTime() || 0) - (a.toJSON().createdAt?.getTime() || 0));

        return all.slice(0, limit);
    }
}
