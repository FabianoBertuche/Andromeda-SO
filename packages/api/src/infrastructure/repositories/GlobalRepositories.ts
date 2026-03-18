import { InMemoryTaskRepository } from "./InMemoryTaskRepository";

// Singleton instances for In-Memory repositories to be shared across the application
export const globalTaskRepository = new InMemoryTaskRepository();
