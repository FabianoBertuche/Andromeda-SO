export abstract class DomainEvent {
    public readonly occurredOn: Date;
    constructor() {
        this.occurredOn = new Date();
    }
}

export class TaskCreated extends DomainEvent {
    constructor(public readonly taskId: string) {
        super();
    }
}

export class TaskStatusChanged extends DomainEvent {
    constructor(
        public readonly taskId: string,
        public readonly oldStatus: string,
        public readonly newStatus: string
    ) {
        super();
    }
}
