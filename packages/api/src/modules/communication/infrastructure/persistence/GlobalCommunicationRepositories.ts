import { InMemoryCommunicationSessionRepository } from "./in-memory-communication-session.repository";
import { InMemoryCommunicationMessageRepository } from "./in-memory-communication-message.repository";

export const globalSessionRepository = new InMemoryCommunicationSessionRepository();
export const globalMessageRepository = new InMemoryCommunicationMessageRepository();
