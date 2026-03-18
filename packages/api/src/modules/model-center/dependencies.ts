import {
    RegisterProviderUseCase,
    SyncModelsUseCase,
    PullModelUseCase,
    DeleteModelUseCase,
    ShowModelInfoUseCase,
    ListRunningModelsUseCase,
    CreateModelUseCase,
    CopyModelUseCase,
    RouteTaskUseCase,
    RunBenchmarkUseCase
} from "@andromeda/core";
import {
    globalProviderRepository,
    globalModelRepository,
    globalBenchmarkRepository,
    globalRoutingDecisionRepository
} from "../../infrastructure/repositories/GlobalRepositories";
import { OllamaProviderAdapter } from "../../infrastructure/adapters/providers/OllamaProviderAdapter";

const ollamaAdapter = new OllamaProviderAdapter();

export const registerProviderUseCase = new RegisterProviderUseCase(globalProviderRepository);
export const syncModelsUseCase = new SyncModelsUseCase(globalProviderRepository, globalModelRepository, ollamaAdapter);
export const pullModelUseCase = new PullModelUseCase(globalProviderRepository, globalModelRepository, ollamaAdapter);
export const deleteModelUseCase = new DeleteModelUseCase(globalProviderRepository, globalModelRepository, ollamaAdapter);
export const showModelInfoUseCase = new ShowModelInfoUseCase(globalProviderRepository, ollamaAdapter);
export const listRunningModelsUseCase = new ListRunningModelsUseCase(globalProviderRepository, ollamaAdapter);
export const createModelUseCase = new CreateModelUseCase(globalProviderRepository, ollamaAdapter);
export const copyModelUseCase = new CopyModelUseCase(globalProviderRepository, ollamaAdapter);

export const routeTaskUseCase = new RouteTaskUseCase(globalModelRepository, globalRoutingDecisionRepository);
export const runBenchmarkUseCase = new RunBenchmarkUseCase(globalBenchmarkRepository, globalModelRepository);
