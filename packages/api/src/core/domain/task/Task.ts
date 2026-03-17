import { v4 as uuidv4 } from "uuid";
import { TaskStatus, TaskState } from "./TaskState";

export interface TaskProps {
    id?: string;
    rawRequest: string;
    status?: TaskStatus;
    createdAt?: Date;
    updatedAt?: Date;
    metadata?: Record<string, any>;
    result?: any;
    auditParecer?: any;
}

export class Task {
    private readonly id: string;
    private readonly rawRequest: string;
    private status: TaskStatus;
    private readonly createdAt: Date;
    private updatedAt: Date;
    private metadata: Record<string, any>;
    private result?: any;
    private auditParecer?: any;

    constructor(props: TaskProps) {
        this.id = props.id || uuidv4();
        this.rawRequest = props.rawRequest;
        this.status = props.status || TaskStatus.RECEIVED;
        this.createdAt = props.createdAt || new Date();
        this.updatedAt = props.updatedAt || new Date();
        this.metadata = props.metadata || {};
        this.result = props.result;
        this.auditParecer = props.auditParecer;
    }

    getId(): string { return this.id; }
    getRawRequest(): string { return this.rawRequest; }
    getStatus(): TaskStatus { return this.status; }
    getCreatedAt(): Date { return this.createdAt; }
    getUpdatedAt(): Date { return this.updatedAt; }
    getMetadata(): Record<string, any> { return { ...this.metadata }; }
    getResult(): any { return this.result; }
    getAuditParecer(): any { return this.auditParecer; }

    transitionTo(newStatus: TaskStatus): void {
        if (!TaskState.canTransition(this.status, newStatus)) {
            throw new Error(`Invalid transition from ${this.status} to ${newStatus}`);
        }
        this.status = newStatus;
        this.updatedAt = new Date();
    }

    setResult(result: any): void {
        this.result = result;
        this.updatedAt = new Date();
    }

    setAuditParecer(parecer: any): void {
        this.auditParecer = parecer;
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            rawRequest: this.rawRequest,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            metadata: this.metadata,
            result: this.result,
            auditParecer: this.auditParecer,
        };
    }
}
