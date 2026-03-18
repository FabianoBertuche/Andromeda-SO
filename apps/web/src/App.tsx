import React, { useState } from 'react';
import { useWs } from './contexts/WsContext';
import { Send, Activity, Terminal, Clock, User } from 'lucide-react';
import { TimelineView } from './components/Timeline/TimelineView';

function App() {
  const { isConnected, session, activeTask, socket } = useWs();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'console' | 'timeline'>('console');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    // Envia o payload no formato esperado pelo Gateway
    socket.emit('client_message', {
      content: {
        type: 'text',
        text: input
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
            <>
              <div className="text-center py-4">
                <h2 className="text-2xl font-light text-slate-400">Welcome to Andromeda Kernel</h2>
                <p className="text-sm text-slate-500 mt-1">Realtime Operational Console MVP03</p>
              </div>

              {/* Active Task Status (Glass card) */}
              {activeTask && (
                <div className="max-w-3xl mx-auto w-full bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-indigo-400" />
                      Task Executing
                    </h3>
                    <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30 font-bold tracking-wide shadow-sm">
                      {activeTask.status || activeTask.task?.status || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="font-mono text-sm text-slate-400 bg-black/40 p-4 rounded-xl overflow-x-auto border border-white/5 shadow-inner">
                    <pre>{JSON.stringify(activeTask, null, 2)}</pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <TimelineView />
          )}

        </div>

        {/* Input Area */}
        {activeTab === 'console' && (
          <div className="p-6 bg-transparent shrink-0">
            <form onSubmit={handleSend} className="max-w-3xl mx-auto relative group">
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
                  className="p-4 mr-2 text-indigo-400 hover:text-white disabled:opacity-50 transition-colors bg-slate-800 hover:bg-indigo-600 rounded-md my-2 mr-2"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
