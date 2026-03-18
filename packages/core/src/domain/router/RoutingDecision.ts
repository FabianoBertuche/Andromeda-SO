import { v4 as uuidv4 } from "uuid";
import { Capability } from "../model/Capability";

export interface RoutingDecisionProps {
    id?: string;
    taskId: string;
    activityType: Capability | string;
    requiredCapabilities: Capability[];
    candidatesEvaluated: string[]; // array de IDs de modelos
    chosenModelId: string;
    fallbackModelId?: string;
    score: number;
    estimatedCost?: number;
    latencyMs?: number;
    justification: string;
    createdAt?: Date;
}

export class RoutingDecision {
    private id: string;
    private props: RoutingDecisionProps;

    constructor(props: RoutingDecisionProps) {
        this.id = props.id || uuidv4();
        this.props = {
            ...props,
            createdAt: props.createdAt || new Date(),
        };
    }

    getId(): string { return this.id; }
    getTaskId(): string { return this.props.taskId; }
    getChosenModelId(): string { return this.props.chosenModelId; }
    getFallbackModelId(): string | undefined { return this.props.fallbackModelId; }
    getJustification(): string { return this.props.justification; }
    getLatencyMs(): number | undefined { return this.props.latencyMs; }

    toJSON() {
        return {
            id: this.id,
            ...this.props,
        };
    }
}
