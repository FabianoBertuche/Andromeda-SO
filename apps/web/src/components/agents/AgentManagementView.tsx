import React, { useEffect, useMemo, useState } from 'react';
import { Bot, History, MessageSquare, Save, Shield, SlidersHorizontal } from 'lucide-react';
import {
  chatWithAgent,
  getAgentBehavior,
  getAgentConformance,
  getAgentHistory,
  getAgentProfile,
  getAgentProfileHistory,
  getAgentSafeguards,
  restoreAgentProfileVersion,
  updateAgentBehavior,
  updateAgentProfile,
  updateAgentSafeguards,
} from '../../lib/agents';
import type {
  AgentBehaviorConfig,
  AgentConformanceView,
  AgentHistoryItem,
  AgentMarkdownSections,
  AgentProfileDocument,
  AgentProfileHistoryEntry,
  AgentSafeguardConfig,
  AgentSummary,
} from '../../lib/agents';

type AgentTab = 'identity' | 'behavior' | 'safeguards' | 'chat';
type MarkdownKey = keyof AgentMarkdownSections;

const markdownTabs: MarkdownKey[] = ['identity', 'soul', 'rules', 'playbook', 'context'];
const behaviorKeys: Array<{ key: keyof AgentBehaviorConfig; label: string }> = [
  { key: 'formality', label: 'Formality' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'objectivity', label: 'Objectivity' },
  { key: 'detailLevel', label: 'Detail' },
  { key: 'caution', label: 'Caution' },
  { key: 'autonomy', label: 'Autonomy' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'ambiguityTolerance', label: 'Ambiguity' },
  { key: 'proactivity', label: 'Proactivity' },
  { key: 'delegationTendency', label: 'Delegation' },
  { key: 'feedbackFrequency', label: 'Feedback' },
  { key: 'playbookStrictness', label: 'Playbook' },
  { key: 'complianceStrictness', label: 'Compliance' },
  { key: 'selfReviewIntensity', label: 'Self Review' },
  { key: 'evidenceRequirements', label: 'Evidence' },
];

const safeguardToggles: Array<{ key: keyof AgentSafeguardConfig; label: string }> = [
  { key: 'requireAuditOnCriticalTasks', label: 'Require audit on critical tasks' },
  { key: 'alwaysProvideIntermediateFeedback', label: 'Always provide intermediate feedback' },
  { key: 'preferSpecialistDelegation', label: 'Prefer specialist delegation' },
  { key: 'blockOutOfRoleResponses', label: 'Block out-of-role responses' },
  { key: 'runSelfReview', label: 'Run self-review automatically' },
  { key: 'prioritizeSkillFirst', label: 'Prioritize skill-first routing' },
  { key: 'alwaysSuggestNextSteps', label: 'Always suggest next steps' },
];

interface Props {
  agents: AgentSummary[];
  selectedAgentId: string;
  sessionId?: string;
  onSelectAgent: (agentId: string) => void;
  onUseInConsole: (agentId: string) => void;
  refreshAgents: () => Promise<void>;
}

export function AgentManagementView({ agents, selectedAgentId, sessionId, onSelectAgent, onUseInConsole, refreshAgents }: Props) {
  const [activeTab, setActiveTab] = useState<AgentTab>('identity');
  const [activeMarkdown, setActiveMarkdown] = useState<MarkdownKey>('identity');
  const [profile, setProfile] = useState<AgentProfileDocument | null>(null);
  const [behavior, setBehavior] = useState<AgentBehaviorConfig | null>(null);
  const [safeguards, setSafeguards] = useState<AgentSafeguardConfig | null>(null);
  const [profileHistory, setProfileHistory] = useState<AgentProfileHistoryEntry[]>([]);
  const [history, setHistory] = useState<AgentHistoryItem[]>([]);
  const [conformance, setConformance] = useState<AgentConformanceView | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; meta?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === selectedAgentId) || null, [agents, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    void loadAgent(selectedAgentId);
  }, [selectedAgentId]);

  async function loadAgent(agentId: string) {
    setLoading(true);
    setError('');
    try {
      const [nextProfile, nextBehavior, nextSafeguards, nextProfileHistory, nextHistory, nextConformance] = await Promise.all([
        getAgentProfile(agentId),
        getAgentBehavior(agentId),
        getAgentSafeguards(agentId),
        getAgentProfileHistory(agentId),
        getAgentHistory(agentId),
        getAgentConformance(agentId),
      ]);

      setProfile(nextProfile);
      setBehavior(nextBehavior);
      setSafeguards(nextSafeguards);
      setProfileHistory(nextProfileHistory);
      setHistory(nextHistory);
      setConformance(nextConformance);
      setChatMessages([]);
    } catch (nextError) {
      console.error('Erro ao carregar agente:', nextError);
      setError('Nao foi possivel carregar o agente.');
    } finally {
      setLoading(false);
    }
  }

  async function saveIdentity() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateAgentProfile(profile.id, { markdown: profile.markdown });
      await refreshAgents();
      await loadAgent(profile.id);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar o texto do perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function saveBehavior() {
    if (!behavior || !selectedAgentId) return;
    setSaving(true);
    try {
      await updateAgentBehavior(selectedAgentId, behavior);
      await refreshAgents();
      await loadAgent(selectedAgentId);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar o comportamento.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSafeguards() {
    if (!safeguards || !selectedAgentId) return;
    setSaving(true);
    try {
      await updateAgentSafeguards(selectedAgentId, safeguards);
      await refreshAgents();
      await loadAgent(selectedAgentId);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar as safeguards.');
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(version: string) {
    if (!selectedAgentId) return;
    setSaving(true);
    try {
      await restoreAgentProfileVersion(selectedAgentId, version);
      await refreshAgents();
      await loadAgent(selectedAgentId);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao restaurar a versao.');
    } finally {
      setSaving(false);
    }
  }

  async function sendChat(event: React.FormEvent) {
    event.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || !selectedAgentId) return;

    setChatMessages((previous) => [...previous, { role: 'user', content: prompt }]);
    setChatInput('');

    try {
      const response = await chatWithAgent(selectedAgentId, { prompt, sessionId, interactionMode: 'chat' });
      const score = response.audit?.overallConformanceScore ?? response.result?.audit?.overallConformanceScore;
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: response.result?.content || 'Sem resposta do agente.',
          meta: score !== undefined ? `Conformance ${score}` : response.result?.model,
        },
      ]);
      await refreshAgents();
      await loadAgent(selectedAgentId);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao conversar com o agente.');
    }
  }

  if (agents.length === 0) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">Nenhum agente disponivel.</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-500">Agents</div>
        <div className="space-y-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelectAgent(agent.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                agent.id === selectedAgentId ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-semibold text-white">{agent.name}</div>
              <div className="mt-1 text-xs text-slate-400">{agent.role}</div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>{agent.teamId}</span>
                <span>{agent.profileVersion}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        {selectedAgent && profile && behavior && safeguards ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-indigo-300">{selectedAgent.teamId}</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">{selectedAgent.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{profile.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  {profile.identity.specializations.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-700 px-3 py-1">{tag}</span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUseInConsole(selectedAgent.id)}
                className="rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
              >
                Use in Console
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MiniStat icon={<Shield className="h-4 w-4" />} label="Conformance" value={conformance?.averageOverallConformanceScore?.toString() || 'n/a'} />
              <MiniStat icon={<History className="h-4 w-4" />} label="Version" value={profile.version} />
              <MiniStat icon={<Bot className="h-4 w-4" />} label="Model" value={profile.defaultModel} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <TabButton active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} icon={<MessageSquare className="h-4 w-4" />} label="Identity" />
              <TabButton active={activeTab === 'behavior'} onClick={() => setActiveTab('behavior')} icon={<SlidersHorizontal className="h-4 w-4" />} label="Behavior" />
              <TabButton active={activeTab === 'safeguards'} onClick={() => setActiveTab('safeguards')} icon={<Shield className="h-4 w-4" />} label="Safeguards" />
              <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<Bot className="h-4 w-4" />} label="Chat" />
            </div>

            {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            {loading ? <div className="mt-6 text-sm text-slate-400">Carregando...</div> : null}

            {!loading && activeTab === 'identity' && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {markdownTabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveMarkdown(tab)}
                        className={`rounded-full px-3 py-1 text-xs transition ${activeMarkdown === tab ? 'bg-white text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                      >
                        {tab}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => void saveIdentity()}
                      disabled={saving}
                      className="ml-auto inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save Text
                    </button>
                  </div>
                  <textarea
                    value={profile.markdown[activeMarkdown]}
                    onChange={(event) =>
                      setProfile((current) =>
                        current
                          ? {
                              ...current,
                              markdown: {
                                ...current.markdown,
                                [activeMarkdown]: event.target.value,
                              },
                            }
                          : current,
                      )
                    }
                    className="min-h-[420px] w-full rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <pre className="min-h-[220px] whitespace-pre-wrap rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
                    {profile.markdown[activeMarkdown]}
                  </pre>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Version History</div>
                    <div className="space-y-2">
                      {profileHistory.map((entry) => (
                        <div key={`${entry.version}-${entry.updatedAt}`} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm text-white">{entry.version}</div>
                              <div className="text-xs text-slate-500">{entry.summary}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void restoreVersion(entry.version)}
                              disabled={saving || entry.version === profile.version}
                              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
                            >
                              Restore
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'behavior' && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {behaviorKeys.map((item) => (
                    <label key={item.key} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <div className="mb-2 flex items-center justify-between">
                        <span>{item.label}</span>
                        <span className="font-mono text-indigo-300">{behavior[item.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={behavior[item.key]}
                        onChange={(event) =>
                          setBehavior((current) =>
                            current
                              ? {
                                  ...current,
                                  [item.key]: Number(event.target.value),
                                }
                              : current,
                          )
                        }
                        className="w-full accent-indigo-400"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void saveBehavior()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save Behavior
                  </button>
                </div>
              </div>
            )}

            {!loading && activeTab === 'safeguards' && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <div className="mb-2">Mode</div>
                    <select
                      value={safeguards.mode}
                      onChange={(event) =>
                        setSafeguards((current) =>
                          current
                            ? { ...current, mode: event.target.value as AgentSafeguardConfig['mode'] }
                            : current,
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="strict">Strict</option>
                      <option value="balanced">Balanced</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </label>
                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <div className="mb-2 flex items-center justify-between">
                      <span>Minimum Conformance</span>
                      <span className="font-mono text-indigo-300">{safeguards.minOverallConformance}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={safeguards.minOverallConformance}
                      onChange={(event) =>
                        setSafeguards((current) =>
                          current
                            ? { ...current, minOverallConformance: Number(event.target.value) }
                            : current,
                        )
                      }
                      className="w-full accent-indigo-400"
                    />
                  </label>
                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <div className="mb-2">Corrective Action</div>
                    <select
                      value={safeguards.correctiveAction}
                      onChange={(event) =>
                        setSafeguards((current) =>
                          current
                            ? { ...current, correctiveAction: event.target.value as AgentSafeguardConfig['correctiveAction'] }
                            : current,
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="allow_with_notice">Allow With Notice</option>
                      <option value="rewrite">Rewrite</option>
                      <option value="fallback">Fallback</option>
                      <option value="block">Block</option>
                    </select>
                  </label>
                  {safeguardToggles.map((toggle) => (
                    <label key={toggle.key} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                      <span>{toggle.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(safeguards[toggle.key])}
                        onChange={(event) =>
                          setSafeguards((current) =>
                            current
                              ? { ...current, [toggle.key]: event.target.checked }
                              : current,
                          )
                        }
                        className="h-4 w-4 accent-indigo-400"
                      />
                    </label>
                  ))}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void saveSafeguards()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save Safeguards
                    </button>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm font-semibold text-slate-200">Recent Violations</div>
                  {(conformance?.recentViolations || []).slice(0, 6).map((violation) => (
                    <div key={violation} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                      {violation}
                    </div>
                  ))}
                  {(!conformance?.recentViolations || conformance.recentViolations.length === 0) && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                      No recent violations recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && activeTab === 'chat' && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="max-h-[360px] space-y-3 overflow-y-auto">
                    {chatMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm ${
                          message.role === 'user'
                            ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-50'
                            : 'border-slate-800 bg-slate-900/80 text-slate-200'
                        }`}>
                          <div>{message.content}</div>
                          {message.meta && <div className="mt-2 text-[11px] text-slate-500">{message.meta}</div>}
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-6 text-center text-sm text-slate-500">
                        Start a direct conversation with this agent.
                      </div>
                    )}
                  </div>
                  <form onSubmit={sendChat} className="mt-4 space-y-3">
                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Send a request directly to this agent..."
                      className="min-h-[120px] w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-100 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-40"
                      >
                        Send to Agent
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Recent Executions</div>
                    <div className="space-y-2">
                      {history.slice(0, 5).map((item) => (
                        <div key={item.taskId} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                          <div className="text-sm text-white">{item.prompt}</div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>{item.model || 'n/a'}</span>
                            <span>{item.audit?.overallConformanceScore !== undefined ? item.audit.overallConformanceScore : item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400">Selecione um agente para abrir a gestao.</div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">{icon}{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
        active ? 'border-indigo-400/60 bg-indigo-500/10 text-indigo-100' : 'border-slate-700 text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
