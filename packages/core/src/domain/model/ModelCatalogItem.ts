import { v4 as uuidv4 } from "uuid";
import { Capability } from "./Capability";
import { Pricing } from "./Pricing";

export interface ModelMetrics {
    avgLatencyMs?: number;
    successRate?: number;
    fallbackRate?: number;
    avgTokensIn?: number;
    avgTokensOut?: number;
    avgCostPerRun?: number;
}

export interface ModelScores {
    overall?: number;
    [key: string]: number | undefined; // Scores para cada capability
}

export interface ModelCatalogItemProps {
    id?: string;
    providerId: string;
    externalModelId: string;
    displayName: string;
    locality: "local" | "cloud";
    family?: string;
    parameterSize?: string;
    quantization?: string;
    contextWindow?: number;
    capabilities: Capability[];
    enabled: boolean;
    health: "ok" | "warning" | "error" | "unknown";
    pricing?: Pricing;
    metrics?: ModelMetrics;
    scores?: ModelScores;
    recommendation?: {
        primaryUse?: string[];
        notes?: string;
    };
}

export class ModelCatalogItem {
    private id: string;
    private props: ModelCatalogItemProps;

    constructor(props: ModelCatalogItemProps) {
        this.id = props.id || uuidv4();
        this.props = {
            ...props,
            capabilities: props.capabilities || [],
            enabled: props.enabled ?? true,
            health: props.health || "unknown",
            metrics: props.metrics || {},
            scores: props.scores || {},
        };
    }

    getId(): string { return this.id; }
    getProviderId(): string { return this.props.providerId; }
    getExternalModelId(): string { return this.props.externalModelId; }
    getDisplayName(): string { return this.props.displayName; }
    getLocality(): string { return this.props.locality; }
    getCapabilities(): Capability[] { return this.props.capabilities; }
    isEnabled(): boolean { return this.props.enabled; }
    getHealth(): string { return this.props.health; }
    getScores(): ModelScores { return this.props.scores!; }

    addCapability(cap: Capability) {
        if (!this.props.capabilities.includes(cap)) {
            this.props.capabilities.push(cap);
        }
    }

    updateScore(cap: Capability | string, score: number) {
        if (!this.props.scores) this.props.scores = {};
        this.props.scores[cap as string] = score;
    }

    toJSON() {
        return {
            id: this.id,
            ...this.props,
        };
    }
}
