import React, { useState } from 'react';
import { useWs } from './contexts/WsContext';
import { Send, Activity, Terminal, Clock, User, Cpu } from 'lucide-react';
import { TimelineView } from './components/Timeline/TimelineView';
import { ModelCenterView } from './components/model-center/ModelCenterView';

function App() {
  const { isConnected, session, activeTask, socket } = useWs();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'console' | 'timeline' | 'model-center'>('console');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/model-center/models')
      .then(res => res.json())
      .then(data => {
        setAvailableModels(data);
        if (data.length > 0) setSelectedModel(data[0].externalModelId);
      })
      .catch(console.error);
  }, []);

  // Monitorar eventos de tarefa concluída para mostrar resposta do LLM
  React.useEffect(() => {
    if (!socket) return;

    const handleGatewayEvent = (event: any) => {
      if (event.type === 'task.completed' && event.result) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: event.result.content || JSON.stringify(event.result),
          model: event.result.model,
          timestamp: event.timestamp
        }]);
      }
    };

    socket.on('gateway.event', handleGatewayEvent);
    return () => { socket.off('gateway.event', handleGatewayEvent); };
  }, [socket]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const userMsg = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);

    // Envia o payload no formato esperado pelo Gateway
    socket.emit('client_message', {
      content: {
        type: 'text',
        text: input
      },
      metadata: {
        modelId: selectedModel
      }
    });

    setInput('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Terminal className="w-6 h-6 text-indigo-400 mr-2" />
          <h1 className="text-xl font-bold tracking-tight text-white">Andromeda OS</h1>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <button onClick={() => setActiveTab('console')} className={`w-full flex items-center px-6 py-2 transition-colors ${activeTab === 'console' ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`}>
                <Activity className="w-5 h-5 mr-3" />
                Console
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('timeline')} className={`w-full flex items-center px-6 py-2 transition-colors ${activeTab === 'timeline' ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`}>
                <Clock className="w-5 h-5 mr-3" />
                Timelines
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('model-center')} className={`w-full flex items-center px-6 py-2 transition-colors ${activeTab === 'model-center' ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`}>
                <Cpu className="w-5 h-5 mr-3" />
                Model Center
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
            {isConnected ? 'Gateway Online' : 'Connecting...'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center text-sm">
            <span className="text-slate-500 mr-2">Session:</span>
            <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              {session ? session.sessionId : 'Wait...'}
            </span>
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

          {activeTab === 'console' ? (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
              <div className="text-center py-4">
                <h2 className="text-2xl font-light text-slate-200">Andromeda Command Console</h2>
                <p className="text-sm text-slate-500 mt-1">Chat direto com modelos locais e roteador inteligente</p>
              </div>

              {/* Chat History */}
              <div className="space-y-4 mb-8">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
                      {msg.role === 'assistant' && (
                        <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> {msg.model || 'Andromeda AI'}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <div className="text-[10px] text-slate-500 mt-2 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Task Status (Glass card) */}
              {activeTask && (
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-indigo-400" />
                      Status da Execução
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
          ) : activeTab === 'timeline' ? (
            <TimelineView />
          ) : activeTab === 'model-center' ? (
            <ModelCenterView />
          ) : null}

        </div>

        {/* Input Area */}
        {activeTab === 'console' && (
          <div className="p-6 bg-transparent shrink-0">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
              <div className="flex items-center gap-2 px-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Target Model:</span>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-indigo-400 text-[10px] px-2 py-0.5 rounded outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Automático (Router)</option>
                  {availableModels.map(m => (
                    <option key={m.id} value={m.externalModelId}>{m.displayName || m.externalModelId}</option>
                  ))}
                </select>
              </div>
              <form onSubmit={handleSend} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Initialize sequence or type a command..."
                    className="flex-1 bg-transparent py-4 px-6 text-white outline-none placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !input.trim()}
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

export default App;
