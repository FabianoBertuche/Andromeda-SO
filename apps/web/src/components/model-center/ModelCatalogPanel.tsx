import React, { useState, useEffect } from 'react';

export const ModelCatalogPanel: React.FC = () => {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const response = await fetch('/model-center/models');
            if (response.ok) {
                const data = await response.json();
                setModels(data);
            }
        } catch (error) {
            console.error("Erro ao buscar catálogo de modelos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handlePull = async () => {
        const modelName = prompt("Digite o nome do modelo para baixar (ex: llama3, mistral):");
        if (!modelName) return;

        try {
            setLoading(true);
            const response = await fetch('/model-center/providers/ollama-local-id/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelName })
            });
            if (response.ok) {
                alert(`Solicitação de pull para ${modelName} enviada! Aguarde a conclusão.`);
                fetchModels();
            } else {
                alert("Erro ao solicitar pull do modelo.");
            }
        } catch (error) {
            console.error("Erro no pull:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (providerId: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover o modelo ${name}?`)) return;

        try {
            setLoading(true);
            const response = await fetch(`/model-center/providers/${providerId}/models/${name}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchModels();
            } else {
                alert("Erro ao deletar modelo.");
            }
        } catch (error) {
            console.error("Erro ao deletar:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowInfo = async (id: string) => {
        try {
            const response = await fetch(`/model-center/models/${id}`);
            if (response.ok) {
                const info = await response.json();
                alert(JSON.stringify(info, null, 2));
            }
        } catch (error) {
            console.error("Erro ao buscar info:", error);
        }
    };

    const [playgroundModel, setPlaygroundModel] = useState<any>(null);
    const [testPrompt, setTestPrompt] = useState('Olá, como você está?');
    const [testResult, setTestResult] = useState('');

    const handleTest = async () => {
        if (!playgroundModel) return;
        setTestResult('Processando...');
        try {
            const response = await fetch('/gateway/client_message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'web',
                    content: { type: 'text', text: testPrompt },
                    metadata: { modelId: playgroundModel.externalModelId }
                })
            });
            if (response.ok) {
                // Como o gateway é async via task, aqui poderíamos apenas dizer que a task foi criada
                // Mas para o playground vamos tentar usar um endpoint direto se existir ou apenas alertar
                alert("Teste enviado! Verifique a resposta no Console ou na Timeline.");
            }
        } catch (error) {
            setTestResult('Erro: ' + error);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative">
            {/* Modal Playground Simples */}
            {playgroundModel && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-indigo-400" /> Playground: {playgroundModel.externalModelId}
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">Teste o modelo enviando um prompt direto.</p>

                        <textarea
                            value={testPrompt}
                            onChange={e => setTestPrompt(e.target.value)}
                            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:border-indigo-500 outline-none transition-all mb-4"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setPlaygroundModel(null)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleTest}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20"
                            >
                                Enviar Teste
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <span className="text-purple-500 text-3xl">📚</span> Catálogo de Modelos
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchModels}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                        title="Link Atualizar"
                    >
                        🔄
                    </button>
                    <button
                        onClick={handlePull}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        📥 Pull Model
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-sm">
                            <th className="pb-3 pl-4 font-medium">Modelo</th>
                            <th className="pb-3 font-medium">Ambiente</th>
                            <th className="pb-3 font-medium">Capacidades</th>
                            <th className="pb-3 font-medium text-right pr-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-200">
                        {models.map((m, idx) => (
                            <tr key={m.id || idx} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                                <td className="py-4 pl-4 font-medium text-white">{m.displayName || m.externalModelId}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${m.locality === 'local' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {(m.locality || 'local').toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                                        {(m.capabilities || []).map((cap: string) => (
                                            <span key={cap} className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] uppercase tracking-wider">
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-4 pr-4 text-right">
                                    <div className="flex justify-end gap-2 text-xl">
                                        <button
                                            onClick={() => setPlaygroundModel(m)}
                                            className="p-1.5 hover:bg-indigo-500/20 rounded border border-slate-700 hover:border-indigo-500/50 text-indigo-400 transition-colors"
                                            title="Testar Chat"
                                        >
                                            💬
                                        </button>
                                        <button
                                            onClick={() => handleShowInfo(m.id)}
                                            className="p-1.5 hover:bg-slate-700 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors"
                                            title="Info"
                                        >
                                            ℹ️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(m.providerId, m.externalModelId)}
                                            className="p-1.5 hover:bg-red-500/20 rounded border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-colors"
                                            title="Remover"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {models.length === 0 && !loading && (
                <div className="py-20 text-center text-slate-500">
                    Nenhum modelo encontrado. Clique em Sync no painel de Providers ou faça um Pull.
                </div>
            )}
        </div>
    );
};

// Simple icons
const Cpu = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
        <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
    </svg>
);
