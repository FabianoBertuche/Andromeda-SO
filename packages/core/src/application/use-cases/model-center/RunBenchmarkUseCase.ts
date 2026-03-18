import { IBenchmarkRepository } from "../../../domain/benchmark/IBenchmarkRepository";
import { BenchmarkResult } from "../../../domain/benchmark/BenchmarkResult";
import { IModelRepository } from "../../../domain/model/IModelRepository";

export interface RunBenchmarkInputDTO {
    modelId: string;
    suite: string;
    taskType: string;
}

export class RunBenchmarkUseCase {
    constructor(
        private benchmarkRepository: IBenchmarkRepository,
        private modelRepository: IModelRepository
    ) { }

    async execute(input: RunBenchmarkInputDTO): Promise<BenchmarkResult> {
        const model = await this.modelRepository.findById(input.modelId);
        if (!model) throw new Error("Modelo não encontrado");

        // Simulação da execução do benchmark para o MVP04 inicial
        const simulatedScore = Math.floor(Math.random() * 3) + 7; // nota 7-9
        const simulatedLatency = Math.floor(Math.random() * 500) + 200; // 200-700ms

        const result = new BenchmarkResult({
            modelId: input.modelId,
            suite: input.suite,
            taskType: input.taskType,
            score: simulatedScore,
            latencyMs: simulatedLatency,
            success: true,
            tokensIn: 100,
            tokensOut: 50,
        });

        await this.benchmarkRepository.save(result);

        model.updateScore(input.taskType, simulatedScore);
        await this.modelRepository.save(model);

        return result;
    }
}
