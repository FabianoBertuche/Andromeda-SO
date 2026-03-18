import React, { useState, useEffect } from 'react';

export const RouterIntelligencePanel: React.FC = () => {
    const [simulating, setSimulating] = useState(false);
    const [activity, setActivity] = useState('coding');
    const [decisions, setDecisions] = useState<any[]>([]);
    const [lastDecision, setLastDecision] = useState<any | null>(null);

    const fetchDecisions = async () => {
        try {
            const res = await fetch('/model-center/router/decisions');
            if (res.ok) {
                const data = await res.json();
                setDecisions(data);
            }
        } catch (error) {
            console.error("Erro ao buscar decisões:", error);
        }
    };

    useEffect(() => {
        fetchDecisions();
    }, []);

    const handleSimulate = async () => {
        setSimulating(true);
        setLastDecision(null);
        try {
            const res = await fetch('/model-center/router/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: `sim-${Date.now()}`,
                    activityType: activity,
                    requiredCapabilities: [activity]
                })
            });
            if (res.ok) {
                const data = await res.json();
                setLastDecision(data);
                fetchDecisions();
            }
        } catch (error) {
            console.error("Erro na simulação:", error);
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="text-indigo-500 text-3xl">🧠</span> Router Intelligence
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1 bg-slate-800 rounded-lg border border-slate-700 p-5">
                    <h3 className="text-lg font-medium text-white mb-4">Simulador de Roteamento</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Tipo de Atividade</label>
                            <select
                                value={activity}
                                onChange={(e) => setActivity(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-indigo-500"
                            >
                                <option value="coding">Software Engineering (Coding)</option>
                                <option value="reasoning">Complex Reasoning</option>
                                <option value="vision">Visual Analysis</option>
                                <option value="chat">General Chat</option>
                            </select>
                        </div>
                        <button
                            onClick={handleSimulate}
                            disabled={simulating}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            {simulating ? "Processando..." : "Simular Decisão"}
                        </button>

                        {lastDecision && (
                            <div className="mt-4 space-y-1 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-emerald-400 uppercase font-bold">Modelo Escolhido</p>
                                <p className="text-lg font-mono text-white">{lastDecision.chosenModelId}</p>
                                <p className="text-[11px] text-slate-300">
                                    Score: {(lastDecision.score ?? 0).toFixed(2)} · Latência: {lastDecision.latencyMs ?? 0}ms
                                </p>
                                {lastDecision.justification && (
                                    <p className="text-[11px] text-slate-400">Motivo: {lastDecision.justification}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 p-5">
                    <h3 className="text-lg font-medium text-white mb-4">Histórico de Decisões</h3>
                    <div className="overflow-hidden rounded-lg border border-slate-700">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Atividade</th>
                                    <th className="px-4 py-3">Modelo</th>
                                    <th className="px-4 py-3 hidden md:table-cell">Score</th>
                                    <th className="px-4 py-3 hidden lg:table-cell">Latência</th>
                                    <th className="px-4 py-3 hidden xl:table-cell">Capacidades</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 text-slate-300">
                                {decisions.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {(d.createdAt ? new Date(d.createdAt) : null)?.toLocaleTimeString() ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">{d.activityType}</td>
                                        <td className="px-4 py-3 text-indigo-400 font-medium">{d.chosenModelId}</td>
                                        <td className="px-4 py-3 hidden md:table-cell text-green-400 font-semibold">{(d.score ?? 0).toFixed(2)}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-slate-500">{d.latencyMs ?? 0}ms</td>
                                        <td className="px-4 py-3 hidden xl:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {(d.requiredCapabilities || []).map((cap: string) => (
                                                    <span key={cap} className="px-2 py-0.5 bg-slate-900 rounded border border-slate-600 text-[10px]">
                                                        {cap}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {decisions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Nenhuma decisão registrada.</td>
                                </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
