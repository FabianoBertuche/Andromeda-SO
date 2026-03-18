import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Clock, Cpu, Send, Terminal, User, Users } from 'lucide-react';
import { AgentManagementView } from './components/agents/AgentManagementView';
import { TimelineView } from './components/Timeline/TimelineView';
import { ModelCenterView } from './components/model-center/ModelCenterView';
import { useWs } from './contexts/WsContext';
import { createGatewayTask, pollGatewayTask } from './lib/gateway';
import { listAgents } from './lib/agents';
import type { AgentSummary } from './lib/agents';

interface AvailableModel {
  id: string;
  externalModelId: string;
  displayName: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  agentName?: string;
  conformance?: number;
}

type ActiveTab = 'console' | 'timeline' | 'model-center' | 'agents';

function App() {
  const { isConnected, session, activeTask } = useWs();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('console');
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(() => localStorage.getItem('andromeda_selected_agent') || '');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [consoleError, setConsoleError] = useState('');

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || null,
    [agents, selectedAgentId],
  );

  const loadAvailableModels = async () => {
    try {
      let response = await fetch('/model-center/models');
      let data = await response.json() as AvailableModel[];

      if (data.length === 0) {
        await fetch('/model-center/providers/ollama-local-id/sync', { method: 'POST' }).catch(() => null);
        response = await fetch('/model-center/models');
        data = await response.json() as AvailableModel[];
      }

      setAvailableModels(data);
      setSelectedModel((currentSelectedModel) => {
        if (currentSelectedModel && data.some((model) => model.id === currentSelectedModel)) {
          return currentSelectedModel;
        }
        return data[0]?.id || '';
      });
    } catch (error) {
      console.error('Erro ao carregar modelos do console:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await listAgents();
      setAgents(data);
      setSelectedAgentId((currentSelectedAgent) => {
        if (currentSelectedAgent && data.some((agent) => agent.id === currentSelectedAgent)) {
          return currentSelectedAgent;
        }
        return data[0]?.id || '';
      });
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    }
  };

  useEffect(() => {
    void loadAvailableModels();
    const intervalId = window.setInterval(() => {
      void loadAvailableModels();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    void loadAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      localStorage.setItem('andromeda_selected_agent', selectedAgentId);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (activeTab === 'console') {
      void loadAvailableModels();
      void loadAgents();
    }
  }, [activeTab]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setChatMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput('');
    setSending(true);
    setConsoleError('');

    try {
      const task = await createGatewayTask({
        channel: 'web',
        session: { id: session?.sessionId },
        content: {
          type: 'text',
          text: prompt,
        },
        metadata: {
          modelId: selectedModel || undefined,
          activityType: selectedModel ? undefined : 'chat.general',
          context: {
            targetAgentId: selectedAgent?.id,
            targetAgentVersion: selectedAgent?.profileVersion,
            interactionMode: 'chat',
          },
        },
      });

      const taskId = task.task?.id;
      if (!taskId) {
        throw new Error('Gateway nao retornou o identificador da task.');
      }

      const status = await pollGatewayTask(taskId);
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: status.result?.content || status.result?.error || 'Sem resposta do modelo.',
          model: status.result?.model || thisModelLabel(selectedModel, availableModels) || 'automatic-router',
          agentName: status.result?.agent?.name || selectedAgent?.name || 'Andromeda Agent',
          conformance: status.result?.audit?.overallConformanceScore ?? status.auditParecer?.overallConformanceScore,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar mensagem.';
      setConsoleError(message);
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: `Erro: ${message}`,
          model: 'gateway',
          agentName: selectedAgent?.name || 'Andromeda Agent',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      void loadAgents();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Terminal className="w-6 h-6 text-indigo-400 mr-2" />
          <h1 className="text-xl font-bold tracking-tight text-white">Andromeda OS</h1>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <button onClick={() => setActiveTab('console')} className={navClass(activeTab === 'console')}>
                <Activity className="w-5 h-5 mr-3" />
                Console
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('agents')} className={navClass(activeTab === 'agents')}>
                <Users className="w-5 h-5 mr-3" />
                Agents
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('timeline')} className={navClass(activeTab === 'timeline')}>
                <Clock className="w-5 h-5 mr-3" />
                Timelines
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('model-center')} className={navClass(activeTab === 'model-center')}>
                <Cpu className="w-5 h-5 mr-3" />
                Model Center
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
            {isConnected ? 'Gateway Online' : 'Gateway Offline'}
          </div>
          {selectedAgent && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Active Agent</div>
              <div className="mt-1 text-sm text-white">{selectedAgent.name}</div>
              <div className="text-xs text-slate-500">{selectedAgent.profileVersion}</div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">Session:</span>
            <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              {session ? session.sessionId : 'Wait...'}
            </span>
            {selectedAgent && (
              <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                {selectedAgent.name}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {activeTab === 'console' ? (
            <ConsoleView
              selectedAgent={selectedAgent}
              chatMessages={chatMessages}
              activeTask={activeTask}
            />
          ) : activeTab === 'agents' ? (
            <AgentManagementView
              agents={agents}
              selectedAgentId={selectedAgentId}
              sessionId={session?.sessionId}
              onSelectAgent={setSelectedAgentId}
              onUseInConsole={(agentId) => {
                setSelectedAgentId(agentId);
                setActiveTab('console');
              }}
              refreshAgents={loadAgents}
            />
          ) : activeTab === 'timeline' ? (
            <TimelineView />
          ) : (
            <ModelCenterView />
          )}
        </div>

        {activeTab === 'console' && (
          <div className="p-6 bg-transparent shrink-0">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 px-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Target Agent:</span>
                <select
                  value={selectedAgentId}
                  onChange={(event) => setSelectedAgentId(event.target.value)}
                  className="bg-slate-900 border border-slate-700 text-indigo-300 text-[10px] px-2 py-0.5 rounded outline-none focus:border-indigo-500 transition-colors"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>

                <span className="ml-3 text-[10px] text-slate-500 uppercase font-bold">Target Model:</span>
                <select
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  className="bg-slate-900 border border-slate-700 text-indigo-400 text-[10px] px-2 py-0.5 rounded outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Automatic (Router)</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>{model.displayName || model.externalModelId}</option>
                  ))}
                </select>
              </div>

              {consoleError && (
                <div className="px-3 py-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {consoleError}
                </div>
              )}

              <form onSubmit={handleSend} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={selectedAgent ? `Talk to ${selectedAgent.name}...` : 'Initialize sequence or type a command...'}
                    className="flex-1 bg-transparent py-4 px-6 text-white outline-none placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="p-4 mr-2 text-indigo-400 hover:text-white disabled:opacity-50 transition-colors bg-slate-800 hover:bg-indigo-600 rounded-md my-2"
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ConsoleView({ selectedAgent, chatMessages, activeTask }: { selectedAgent: AgentSummary | null; chatMessages: ChatMessage[]; activeTask: any }) {
  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-light text-slate-200">Andromeda Command Console</h2>
        <p className="text-sm text-slate-500 mt-1">
          {selectedAgent ? `Live chat with ${selectedAgent.name}` : 'Chat direto com modelos locais e roteador inteligente'}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {chatMessages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
              {message.role === 'assistant' && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-indigo-300 font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {message.agentName || 'Andromeda AI'}
                  </span>
                  <span className="text-slate-500">{message.model || 'automatic-router'}</span>
                  {message.conformance !== undefined && (
                    <span className="rounded-full border border-indigo-400/30 px-2 py-0.5 text-indigo-200">
                      Conformance {message.conformance}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <div className="text-[10px] text-slate-500 mt-2 text-right">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeTask && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Activity className="w-4 h-4 mr-2 text-indigo-400" />
              Execution Status
            </h3>
            <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30 font-bold tracking-wide shadow-sm">
              {activeTask.status || activeTask.task?.status || 'UNKNOWN'}
            </span>
          </div>

          <div className="font-mono text-xs text-slate-500 bg-black/40 p-3 rounded-xl overflow-x-auto border border-white/5">
            <pre>{JSON.stringify(activeTask, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function navClass(active: boolean) {
  return `w-full flex items-center px-6 py-2 transition-colors ${active ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`;
}

function thisModelLabel(selectedModel: string, models: AvailableModel[]): string | undefined {
  return models.find((model) => model.id === selectedModel)?.displayName;
}

export default App;
