import React, { useState, useEffect } from 'react';

export const BenchmarkLabPanel: React.FC = () => {
    const [running, setRunning] = useState(false);
    const [models, setModels] = useState<any[]>([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedSuite, setSelectedSuite] = useState('General Coding (Python/JS)');
    const [benchmarks, setBenchmarks] = useState<any[]>([]);

    const fetchModels = async () => {
        try {
            const res = await fetch('/model-center/models');
            if (res.ok) {
                const data = await res.json();
                setModels(data);
                if (data.length > 0) setSelectedModel(data[0].id);
            }
        } catch (error) {
            console.error("Erro ao buscar modelos:", error);
        }
    };

    const fetchBenchmarks = async () => {
        if (!selectedModel) return;
        try {
            const res = await fetch(`/model-center/models/${selectedModel}/benchmarks`);
            if (res.ok) {
                const data = await res.json();
                setBenchmarks(data);
            }
        } catch (error) {
            console.error("Erro ao buscar benchmarks:", error);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    useEffect(() => {
        fetchBenchmarks();
    }, [selectedModel]);

    const handleRun = async () => {
        if (!selectedModel) return;
        setRunning(true);
        try {
            const res = await fetch('/model-center/benchmarks/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modelId: selectedModel,
                    suite: selectedSuite,
                    taskType: selectedSuite.includes('Coding') ? 'coding' : 'chat'
                })
            });
            if (res.ok) {
                await fetchBenchmarks();
                alert("Benchmark concluído!");
            }
        } catch (error) {
            console.error("Erro ao rodar benchmark:", error);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="text-orange-500 text-3xl">🧪</span> Laboratório de Benchmark
            </h2>

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-sm text-slate-400 mb-1">Modelo Alvo</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-orange-500"
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.displayName || m.externalModelId}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm text-slate-400 mb-1">Suíte de Testes</label>
                        <select
                            value={selectedSuite}
                            onChange={(e) => setSelectedSuite(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-orange-500"
                        >
                            <option>General Coding (Python/JS)</option>
                            <option>Chat & Raciocínio Completo</option>
                            <option>Saída Estruturada (JSON)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleRun}
                        disabled={running || !selectedModel}
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                    >
                        {running ? "Executando..." : "Rodar Benchmark"}
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium text-white mb-4">Últimas Execuções</h3>
                <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Modelo</th>
                                <th className="px-4 py-3">Suíte</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Latência Média</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300 text-sm divide-y divide-slate-800">
                            {benchmarks.map((b, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3">{models.find(m => m.id === b.modelId)?.externalModelId || b.modelId}</td>
                                    <td className="px-4 py-3">{b.suite}</td>
                                    <td className="px-4 py-3 font-semibold text-green-400">{b.score.toFixed(1)}</td>
                                    <td className="px-4 py-3">{b.latencyMs}ms</td>
                                    <td className="px-4 py-3 text-green-400">{b.success ? "Sucesso" : "Falha"}</td>
                                </tr>
                            ))}
                            {benchmarks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">Nenhum benchmark encontrado para este modelo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
