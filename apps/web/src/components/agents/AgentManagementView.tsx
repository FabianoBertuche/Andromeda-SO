import React, { useEffect, useMemo, useState } from 'react';
import { Bot, History, MessageSquare, Save, Shield, SlidersHorizontal } from 'lucide-react';
import {
  dryRunSandbox,
  chatWithAgent,
  getAgentSandbox,
  getAgentBehavior,
  getAgentConformance,
  getAgentHistory,
  getAgentProfile,
  getAgentProfileHistory,
  getAgentSafeguards,
  listSandboxExecutions,
  listSandboxProfiles,
  restoreAgentProfileVersion,
  startSandboxExecution,
  updateAgentSandbox,
  updateAgentBehavior,
  updateAgentProfile,
  updateAgentSafeguards,
  validateSandboxConfig,
} from '../../lib/agents';
import type {
  AgentBehaviorConfig,
  AgentSandboxConfig,
  AgentConformanceView,
  AgentHistoryItem,
  AgentMarkdownSections,
  AgentProfileDocument,
  AgentProfileHistoryEntry,
  AgentSafeguardConfig,
  AgentSummary,
  SandboxDryRunResult,
  SandboxExecutionItem,
  SandboxConfig,
  SandboxProfile,
  SandboxValidationResult,
} from '../../lib/agents';
import { useTooltipText } from '../../contexts/I18nContext';

type AgentTab = 'identity' | 'behavior' | 'safeguards' | 'sandbox' | 'chat';
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

const sandboxCardTooltipKeys: Record<string, string> = {
  General: 'agents.sandbox.card.general',
  Filesystem: 'agents.sandbox.card.filesystem',
  Network: 'agents.sandbox.card.network',
  Resources: 'agents.sandbox.card.resources',
  Execution: 'agents.sandbox.card.execution',
  Environment: 'agents.sandbox.card.environment',
  Security: 'agents.sandbox.card.security',
  'IO Policy': 'agents.sandbox.card.ioPolicy',
  Audit: 'agents.sandbox.card.audit',
  Approvals: 'agents.sandbox.card.approvals',
};

const sandboxFieldTooltipKeys: Record<string, string> = {
  'Effective mode': 'agents.sandbox.field.effectiveMode',
  'Persist artifacts': 'agents.sandbox.field.persistArtifacts',
  'Working directory': 'agents.sandbox.field.workingDirectory',
  'Read only root': 'agents.sandbox.field.readOnlyRoot',
  'Allowed read paths': 'agents.sandbox.field.allowedReadPaths',
  'Allowed write paths': 'agents.sandbox.field.allowedWritePaths',
  'Temp directory': 'agents.sandbox.field.tempDirectory',
  'Max artifact size (MB)': 'agents.sandbox.field.maxArtifactSize',
  'Max total artifacts (MB)': 'agents.sandbox.field.maxTotalArtifacts',
  'Network mode': 'agents.sandbox.field.networkMode',
  'Block private networks': 'agents.sandbox.field.blockPrivateNetworks',
  'Allow DNS': 'agents.sandbox.field.allowDns',
  'HTTP only': 'agents.sandbox.field.httpOnly',
  'Allowed domains': 'agents.sandbox.field.allowedDomains',
  'Allowed ports': 'agents.sandbox.field.allowedPorts',
  'Timeout (seconds)': 'agents.sandbox.field.timeoutSeconds',
  'CPU limit': 'agents.sandbox.field.cpuLimit',
  'Memory (MB)': 'agents.sandbox.field.memoryMb',
  'Disk (MB)': 'agents.sandbox.field.diskMb',
  'Max processes': 'agents.sandbox.field.maxProcesses',
  'Max threads': 'agents.sandbox.field.maxThreads',
  'Max stdout (KB)': 'agents.sandbox.field.maxStdoutKb',
  'Max stderr (KB)': 'agents.sandbox.field.maxStderrKb',
  'Allow shell': 'agents.sandbox.field.allowShell',
  'Allow subprocess': 'agents.sandbox.field.allowSubprocess',
  'Allow package install': 'agents.sandbox.field.allowPackageInstall',
  'Allowed interpreters': 'agents.sandbox.field.allowedInterpreters',
  'Allowed binaries': 'agents.sandbox.field.allowedBinaries',
  'Blocked binaries': 'agents.sandbox.field.blockedBinaries',
  Runtime: 'agents.sandbox.field.runtime',
  'Runtime version': 'agents.sandbox.field.runtimeVersion',
  Timezone: 'agents.sandbox.field.timezone',
  Locale: 'agents.sandbox.field.locale',
  'Max input (KB)': 'agents.sandbox.field.maxInputKb',
  'Max output (KB)': 'agents.sandbox.field.maxOutputKb',
  'Allowed output types': 'agents.sandbox.field.allowedOutputTypes',
  Retention: 'agents.sandbox.field.retention',
};

export function AgentManagementView({ agents, selectedAgentId, sessionId, onSelectAgent, onUseInConsole, refreshAgents }: Props) {
  const tooltip = useTooltipText();
  const sandboxFieldTooltip = (label: string) => tooltip(sandboxFieldTooltipKeys[label] || 'agents.sandbox.field');
  const [activeTab, setActiveTab] = useState<AgentTab>('identity');
  const [activeMarkdown, setActiveMarkdown] = useState<MarkdownKey>('identity');
  const [profile, setProfile] = useState<AgentProfileDocument | null>(null);
  const [behavior, setBehavior] = useState<AgentBehaviorConfig | null>(null);
  const [safeguards, setSafeguards] = useState<AgentSafeguardConfig | null>(null);
  const [profileHistory, setProfileHistory] = useState<AgentProfileHistoryEntry[]>([]);
  const [history, setHistory] = useState<AgentHistoryItem[]>([]);
  const [conformance, setConformance] = useState<AgentConformanceView | null>(null);
  const [sandboxProfiles, setSandboxProfiles] = useState<SandboxProfile[]>([]);
  const [sandboxConfig, setSandboxConfig] = useState<AgentSandboxConfig | null>(null);
  const [sandboxValidation, setSandboxValidation] = useState<SandboxValidationResult | null>(null);
  const [sandboxDryRun, setSandboxDryRun] = useState<SandboxDryRunResult | null>(null);
  const [sandboxExecutions, setSandboxExecutions] = useState<SandboxExecutionItem[]>([]);
  const [sandboxCapability, setSandboxCapability] = useState('exec');
  const [sandboxCommand, setSandboxCommand] = useState('node -v');
  const [sandboxOverridesText, setSandboxOverridesText] = useState('{}');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; meta?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === selectedAgentId) || null, [agents, selectedAgentId]);
  const selectedSandboxProfile = useMemo(
    () => sandboxProfiles.find((profile) => profile.id === sandboxConfig?.profileId) || null,
    [sandboxProfiles, sandboxConfig?.profileId],
  );
  const sandboxPolicyPreview = useMemo(
    () => sandboxDryRun?.effectivePolicy
      || (sandboxConfig
        ? buildSandboxPreviewConfig(
          sandboxConfig,
          selectedSandboxProfile?.config || null,
          parseSandboxOverrides(sandboxOverridesText),
        )
        : null),
    [sandboxDryRun?.effectivePolicy, sandboxConfig, selectedSandboxProfile, sandboxOverridesText],
  );

  function updateSandboxOverride(path: string[], value: unknown) {
    setSandboxOverridesText((current) => {
      const next = setNestedValue(parseSandboxOverrides(current), path, value);
      return JSON.stringify(next, null, 2);
    });
  }

  useEffect(() => {
    if (!selectedAgentId) return;
    setBehavior(null);
    setSafeguards(null);
    setProfileHistory([]);
    setHistory([]);
    setSandboxConfig(null);
    setSandboxProfiles([]);
    setSandboxExecutions([]);
    setSandboxValidation(null);
    setSandboxDryRun(null);
    setSandboxOverridesText('{}');
    setChatMessages([]);
    void loadAgentShell(selectedAgentId);
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    void loadAgentTab(selectedAgentId, activeTab);
  }, [activeTab, selectedAgentId]);

  async function safeLoad<T>(label: string, loader: Promise<T>, loadErrors: string[] = []): Promise<T | null> {
    try {
      return await loader;
    } catch (nextError) {
      console.error(`Erro ao carregar ${label} do agente:`, nextError);
      loadErrors.push(label);
      return null;
    }
  }

  async function loadAgentShell(agentId: string) {
    setLoading(true);
    setError('');
    try {
      const loadErrors: string[] = [];
      const [nextProfile, nextConformance] = await Promise.all([
        safeLoad('perfil', getAgentProfile(agentId), loadErrors),
        safeLoad('conformance', getAgentConformance(agentId), loadErrors),
      ]);

      setProfile(nextProfile);
      setConformance(nextConformance);
      if (loadErrors.length > 0) {
        setError(`Algumas seções do agente nao puderam ser carregadas: ${loadErrors.join(', ')}.`);
      }
    } catch (nextError) {
      console.error('Erro ao carregar agente:', nextError);
      setError('Nao foi possivel carregar o agente.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentTab(agentId: string, tab: AgentTab) {
    const loadErrors: string[] = [];

    try {
      if (tab === 'identity') {
        const nextProfileHistory = await safeLoad('historico do perfil', getAgentProfileHistory(agentId), loadErrors);
        if (nextProfileHistory) {
          setProfileHistory(nextProfileHistory);
        }
      }

      if (tab === 'behavior') {
        const nextBehavior = await safeLoad('behavior', getAgentBehavior(agentId), loadErrors);
        if (nextBehavior) {
          setBehavior(nextBehavior);
        }
      }

      if (tab === 'safeguards') {
        const nextSafeguards = await safeLoad('safeguards', getAgentSafeguards(agentId), loadErrors);
        if (nextSafeguards) {
          setSafeguards(nextSafeguards);
        }
      }

      if (tab === 'sandbox') {
        const [nextSandboxConfig, nextSandboxProfiles, nextSandboxExecutions] = await Promise.all([
          safeLoad('sandbox', getAgentSandbox(agentId), loadErrors),
          safeLoad('sandbox profiles', listSandboxProfiles(), loadErrors),
          safeLoad('sandbox executions', listSandboxExecutions(), loadErrors),
        ]);

        setSandboxConfig(nextSandboxConfig);
        setSandboxProfiles(nextSandboxProfiles || []);
        setSandboxExecutions((nextSandboxExecutions || []).filter((execution) => execution.agentId === agentId));
        setSandboxOverridesText(JSON.stringify(nextSandboxConfig?.overrides || {}, null, 2));
      }

      if (tab === 'chat') {
        const nextHistory = await safeLoad('historico', getAgentHistory(agentId), loadErrors);
        setHistory(nextHistory || []);
      }

      if (loadErrors.length > 0) {
        setError(`Algumas seções do agente nao puderam ser carregadas: ${loadErrors.join(', ')}.`);
      }
    } catch (nextError) {
      console.error('Erro ao carregar detalhes do agente:', nextError);
      setError('Nao foi possivel carregar os detalhes do agente.');
    }
  }

  async function saveIdentity() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateAgentProfile(profile.id, { markdown: profile.markdown });
      await refreshAgents();
      await loadAgentShell(profile.id);
      await loadAgentTab(profile.id, 'identity');
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
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'behavior');
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
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'safeguards');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar as safeguards.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSandboxConfig() {
    if (!sandboxConfig || !selectedAgentId) return;
    setSaving(true);
    setError('');
    try {
      const overrides = parseSandboxOverrides(sandboxOverridesText);
      const updated = await updateAgentSandbox(selectedAgentId, {
        ...sandboxConfig,
        overrides,
      });
      setSandboxConfig(updated);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'sandbox');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar a sandbox.');
    } finally {
      setSaving(false);
    }
  }

  async function validateSandboxConfigNow() {
    if (!sandboxConfig) return;
    try {
      const validation = await validateSandboxConfig(
        buildSandboxPreviewConfig(
          sandboxConfig,
          selectedSandboxProfile?.config || null,
          parseSandboxOverrides(sandboxOverridesText),
        ),
      );
      setSandboxValidation(validation);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao validar a sandbox.');
    }
  }

  async function runSandboxDryRun() {
    if (!selectedAgentId) return;
    try {
      const payload = buildSandboxExecutionPayload(
        selectedAgentId,
        sandboxCapability,
        sandboxCommand,
        sandboxConfig,
        sandboxProfiles,
        parseSandboxOverrides(sandboxOverridesText),
      );
      const result = await dryRunSandbox(payload);
      setSandboxDryRun(result);
      setSandboxValidation(result.validation);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao executar o dry-run da sandbox.');
    }
  }

  async function runSandboxExecution() {
    if (!selectedAgentId) return;
    setSaving(true);
    try {
      const payload = buildSandboxExecutionPayload(
        selectedAgentId,
        sandboxCapability,
        sandboxCommand,
        sandboxConfig,
        sandboxProfiles,
        parseSandboxOverrides(sandboxOverridesText),
      );
      await startSandboxExecution(payload);
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'sandbox');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao iniciar a execucao de sandbox.');
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
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'identity');
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
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'chat');
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
              title={tooltip('agents.card.select')}
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
      {selectedAgent ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-indigo-300">{selectedAgent.teamId}</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">{selectedAgent.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{profile?.description || 'Carregando configuracoes do agente...'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  {(profile?.identity.specializations || []).map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-700 px-3 py-1">{tag}</span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUseInConsole(selectedAgent.id)}
                disabled={!profile}
                title={tooltip('agents.useInConsole')}
                className="rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
              >
                Use in Console
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MiniStat icon={<Shield className="h-4 w-4" />} label="Conformance" value={conformance?.averageOverallConformanceScore?.toString() || 'n/a'} />
              <MiniStat icon={<History className="h-4 w-4" />} label="Version" value={profile?.version || 'n/a'} />
              <MiniStat icon={<Bot className="h-4 w-4" />} label="Model" value={profile?.defaultModel || 'n/a'} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <TabButton active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} icon={<MessageSquare className="h-4 w-4" />} label="Identity" title={tooltip('agents.tab.identity')} />
              <TabButton active={activeTab === 'behavior'} onClick={() => setActiveTab('behavior')} icon={<SlidersHorizontal className="h-4 w-4" />} label="Behavior" title={tooltip('agents.tab.behavior')} />
              <TabButton active={activeTab === 'safeguards'} onClick={() => setActiveTab('safeguards')} icon={<Shield className="h-4 w-4" />} label="Safeguards" title={tooltip('agents.tab.safeguards')} />
              <TabButton active={activeTab === 'sandbox'} onClick={() => setActiveTab('sandbox')} icon={<Shield className="h-4 w-4" />} label="Sandbox" title={tooltip('agents.tab.sandbox')} />
              <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<Bot className="h-4 w-4" />} label="Chat" title={tooltip('agents.tab.chat')} />
            </div>

            {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            {loading ? <div className="mt-6 text-sm text-slate-400">Carregando...</div> : null}

            {!loading && activeTab === 'identity' && profile && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {markdownTabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveMarkdown(tab)}
                        title={tooltip('agents.identity.markdownTab')}
                        className={`rounded-full px-3 py-1 text-xs transition ${activeMarkdown === tab ? 'bg-white text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                      >
                        {tab}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => void saveIdentity()}
                      disabled={saving}
                      title={tooltip('agents.identity.saveText')}
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
                    title={tooltip('agents.identity.editor')}
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
                              title={tooltip('agents.identity.restore')}
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
            {!loading && activeTab === 'identity' && !profile && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                O perfil ainda nao foi carregado.
              </div>
            )}

            {!loading && activeTab === 'behavior' && behavior && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {behaviorKeys.map((item) => (
                    <label key={item.key} title={tooltip('agents.behavior.slider')} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
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
                    title={tooltip('agents.behavior.save')}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save Behavior
                  </button>
                </div>
              </div>
            )}
            {!loading && activeTab === 'behavior' && !behavior && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                Os parametros de comportamento ainda nao foram carregados.
              </div>
            )}

            {!loading && activeTab === 'safeguards' && safeguards && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <label title={tooltip('agents.safeguards.mode')} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
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
                  <label title={tooltip('agents.safeguards.minConformance')} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
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
                  <label title={tooltip('agents.safeguards.correctiveAction')} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
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
                    <label key={toggle.key} title={tooltip('agents.safeguards.toggle')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
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
                      title={tooltip('agents.safeguards.save')}
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
            {!loading && activeTab === 'safeguards' && !safeguards && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                As safeguards ainda nao foram carregadas.
              </div>
            )}

            {!loading && activeTab === 'sandbox' && sandboxConfig && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SandboxEditorCard title="General">
                      <label title={sandboxFieldTooltip('Effective mode')} className="block text-sm text-slate-200">
                        <div className="mb-2">Effective mode</div>
                        <select
                          value={sandboxPolicyPreview?.mode || 'process'}
                          onChange={(event) => updateSandboxOverride(['mode'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="none">None</option>
                          <option value="process">Process</option>
                          <option value="container">Container</option>
                          <option value="remote">Remote</option>
                        </select>
                      </label>
                      <label title={sandboxFieldTooltip('Persist artifacts')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>Persist artifacts</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.filesystem?.persistArtifacts)}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'persistArtifacts'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Filesystem">
                      <label title={sandboxFieldTooltip('Working directory')} className="block text-sm text-slate-200">
                        <div className="mb-2">Working directory</div>
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.filesystem?.workingDirectory || ''}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'workingDirectory'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Read only root')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>Read only root</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.filesystem?.readOnlyRoot)}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'readOnlyRoot'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed read paths')} className="block text-sm text-slate-200">
                        <div className="mb-2">Allowed read paths</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.filesystem?.allowedReadPaths || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'allowedReadPaths'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed write paths')} className="block text-sm text-slate-200">
                        <div className="mb-2">Allowed write paths</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.filesystem?.allowedWritePaths || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'allowedWritePaths'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Temp directory')} className="block text-sm text-slate-200">
                        <div className="mb-2">Temp directory</div>
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.filesystem?.tempDirectory || ''}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'tempDirectory'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max artifact size (MB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max artifact size (MB)</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.filesystem?.maxArtifactSizeMb ?? 25}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'maxArtifactSizeMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max total artifacts (MB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max total artifacts (MB)</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.filesystem?.maxTotalArtifactSizeMb ?? 100}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'maxTotalArtifactSizeMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Network">
                      <label title={sandboxFieldTooltip('Network mode')} className="block text-sm text-slate-200">
                        <div className="mb-2">Mode</div>
                        <select
                          value={sandboxPolicyPreview?.network?.mode || 'off'}
                          onChange={(event) => updateSandboxOverride(['network', 'mode'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="off">Off</option>
                          <option value="restricted">Restricted</option>
                          <option value="tool_only">Tool only</option>
                          <option value="full">Full</option>
                        </select>
                      </label>
                      <label title={sandboxFieldTooltip('Block private networks')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>Block private networks</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.network?.blockPrivateNetworks)}
                          onChange={(event) => updateSandboxOverride(['network', 'blockPrivateNetworks'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allow DNS')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>Allow DNS</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.network?.allowDns)}
                          onChange={(event) => updateSandboxOverride(['network', 'allowDns'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('HTTP only')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>HTTP only</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.network?.httpOnly)}
                          onChange={(event) => updateSandboxOverride(['network', 'httpOnly'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed domains')} className="block text-sm text-slate-200">
                        <div className="mb-2">Allowed domains</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.network?.allowedDomains || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['network', 'allowedDomains'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed ports')} className="block text-sm text-slate-200">
                        <div className="mb-2">Allowed ports</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.network?.allowedPorts || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['network', 'allowedPorts'], splitCommaNumberList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Resources">
                      <label title={sandboxFieldTooltip('Timeout (seconds)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Timeout (seconds)</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.timeoutSeconds ?? 60}
                          onChange={(event) => updateSandboxOverride(['resources', 'timeoutSeconds'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('CPU limit')} className="block text-sm text-slate-200">
                        <div className="mb-2">CPU limit</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.cpuLimit ?? 1}
                          onChange={(event) => updateSandboxOverride(['resources', 'cpuLimit'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Memory (MB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Memory (MB)</div>
                        <input
                          type="number"
                          min={64}
                          value={sandboxPolicyPreview?.resources?.memoryMb ?? 512}
                          onChange={(event) => updateSandboxOverride(['resources', 'memoryMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Disk (MB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Disk (MB)</div>
                        <input
                          type="number"
                          min={64}
                          value={sandboxPolicyPreview?.resources?.diskMb ?? 512}
                          onChange={(event) => updateSandboxOverride(['resources', 'diskMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max processes')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max processes</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxProcesses ?? 8}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxProcesses'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max threads')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max threads</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxThreads ?? 8}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxThreads'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max stdout (KB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max stdout (KB)</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxStdoutKb ?? 256}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxStdoutKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max stderr (KB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max stderr (KB)</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxStderrKb ?? 256}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxStderrKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Execution">
                      <label title={sandboxFieldTooltip('Allow shell')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>Allow shell</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.execution?.allowShell)}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowShell'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allow subprocess')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>Allow subprocess</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.execution?.allowSubprocessSpawn)}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowSubprocessSpawn'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allow package install')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <span>Allow package install</span>
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.execution?.allowPackageInstall)}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowPackageInstall'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed interpreters')} className="block text-sm text-slate-200">
                        <div className="mb-2">Allowed interpreters</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.execution?.allowedInterpreters || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowedInterpreters'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed binaries')} className="block text-sm text-slate-200">
                        <div className="mb-2">Allowed binaries</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.execution?.allowedBinaries || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowedBinaries'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Blocked binaries')} className="block text-sm text-slate-200">
                        <div className="mb-2">Blocked binaries</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.execution?.blockedBinaries || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['execution', 'blockedBinaries'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Environment">
                      <label title={sandboxFieldTooltip('Runtime')} className="block text-sm text-slate-200">
                        <div className="mb-2">Runtime</div>
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.runtime || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'runtime'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Runtime version')} className="block text-sm text-slate-200">
                        <div className="mb-2">Runtime version</div>
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.runtimeVersion || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'runtimeVersion'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Timezone')} className="block text-sm text-slate-200">
                        <div className="mb-2">Timezone</div>
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.timezone || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'timezone'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Locale')} className="block text-sm text-slate-200">
                        <div className="mb-2">Locale</div>
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.locale || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'locale'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <SandboxToggleRow
                        label="Inherit host env"
                        checked={Boolean(sandboxPolicyPreview?.environment?.inheritHostEnv)}
                        onChange={(checked) => updateSandboxOverride(['environment', 'inheritHostEnv'], checked)}
                      />
                      <SandboxToggleRow
                        label="Secret injection"
                        checked={Boolean(sandboxPolicyPreview?.environment?.secretInjection)}
                        onChange={(checked) => updateSandboxOverride(['environment', 'secretInjection'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Security">
                      <SandboxToggleRow
                        label="Run as non-root"
                        checked={Boolean(sandboxPolicyPreview?.security?.runAsNonRoot)}
                        onChange={(checked) => updateSandboxOverride(['security', 'runAsNonRoot'], checked)}
                      />
                      <SandboxToggleRow
                        label="No new privileges"
                        checked={Boolean(sandboxPolicyPreview?.security?.noNewPrivileges)}
                        onChange={(checked) => updateSandboxOverride(['security', 'noNewPrivileges'], checked)}
                      />
                      <SandboxToggleRow
                        label="Disable privileged mode"
                        checked={Boolean(sandboxPolicyPreview?.security?.disablePrivilegedMode)}
                        onChange={(checked) => updateSandboxOverride(['security', 'disablePrivilegedMode'], checked)}
                      />
                      <SandboxToggleRow
                        label="Disable host namespaces"
                        checked={Boolean(sandboxPolicyPreview?.security?.disableHostNamespaces)}
                        onChange={(checked) => updateSandboxOverride(['security', 'disableHostNamespaces'], checked)}
                      />
                      <SandboxToggleRow
                        label="Disable device access"
                        checked={Boolean(sandboxPolicyPreview?.security?.disableDeviceAccess)}
                        onChange={(checked) => updateSandboxOverride(['security', 'disableDeviceAccess'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="IO Policy">
                      <label title={sandboxFieldTooltip('Max input (KB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max input (KB)</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.ioPolicy?.maxInputSizeKb ?? 256}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'maxInputSizeKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max output (KB)')} className="block text-sm text-slate-200">
                        <div className="mb-2">Max output (KB)</div>
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.ioPolicy?.maxOutputSizeKb ?? 512}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'maxOutputSizeKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed output types')} className="block text-sm text-slate-200">
                        <div className="mb-2">Allowed output types</div>
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.ioPolicy?.allowedOutputTypes || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'allowedOutputTypes'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Retention')} className="block text-sm text-slate-200">
                        <div className="mb-2">Retention</div>
                        <select
                          value={sandboxPolicyPreview?.ioPolicy?.retention || 'task'}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'retention'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="none">None</option>
                          <option value="request">Request</option>
                          <option value="session">Session</option>
                          <option value="task">Task</option>
                          <option value="persistent">Persistent</option>
                        </select>
                      </label>
                      <SandboxToggleRow
                        label="Strip sensitive output"
                        checked={Boolean(sandboxPolicyPreview?.ioPolicy?.stripSensitiveOutput)}
                        onChange={(checked) => updateSandboxOverride(['ioPolicy', 'stripSensitiveOutput'], checked)}
                      />
                      <SandboxToggleRow
                        label="Content scan"
                        checked={Boolean(sandboxPolicyPreview?.ioPolicy?.contentScan)}
                        onChange={(checked) => updateSandboxOverride(['ioPolicy', 'contentScan'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Audit">
                      <SandboxToggleRow
                        label="Audit enabled"
                        checked={Boolean(sandboxPolicyPreview?.audit?.enabled)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'enabled'], checked)}
                      />
                      <SandboxToggleRow
                        label="Capture artifacts"
                        checked={Boolean(sandboxPolicyPreview?.audit?.captureArtifacts)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'captureArtifacts'], checked)}
                      />
                      <SandboxToggleRow
                        label="Capture timing"
                        checked={Boolean(sandboxPolicyPreview?.audit?.captureTiming)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'captureTiming'], checked)}
                      />
                      <SandboxToggleRow
                        label="Capture network events"
                        checked={Boolean(sandboxPolicyPreview?.audit?.captureNetworkEvents)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'captureNetworkEvents'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Approvals">
                      <SandboxToggleRow
                        label="Require approval for exec"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForExec)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForExec'], checked)}
                      />
                      <SandboxToggleRow
                        label="Require approval outside workspace"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForWriteOutsideWorkspace)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForWriteOutsideWorkspace'], checked)}
                      />
                      <SandboxToggleRow
                        label="Require approval for network"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForNetwork)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForNetwork'], checked)}
                      />
                      <SandboxToggleRow
                        label="Require approval for large artifacts"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForLargeArtifacts)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForLargeArtifacts'], checked)}
                      />
                    </SandboxEditorCard>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <div className="mb-2">Capability</div>
                      <input
                        type="text"
                        value={sandboxCapability}
                        onChange={(event) => setSandboxCapability(event.target.value)}
                        title={tooltip('agents.sandbox.test.capability')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <div className="mb-2">Command</div>
                      <input
                        type="text"
                        value={sandboxCommand}
                        onChange={(event) => setSandboxCommand(event.target.value)}
                        title={tooltip('agents.sandbox.test.command')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <div className="mb-2">Preset</div>
                      <select
                        value={sandboxConfig.profileId || ''}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current
                              ? { ...current, profileId: event.target.value || null }
                              : current,
                          )
                        }
                        title={tooltip('agents.sandbox.test.preset')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="">None</option>
                        {sandboxProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label title={tooltip('agents.sandbox.test.enabled')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                      <span>Enabled</span>
                      <input
                        type="checkbox"
                        checked={sandboxConfig.enabled}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current ? { ...current, enabled: event.target.checked } : current,
                          )
                        }
                        className="h-4 w-4 accent-indigo-400"
                      />
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <div className="mb-2">Fallback behavior</div>
                      <select
                        value={sandboxConfig.enforcement.fallbackBehavior}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current
                              ? {
                                  ...current,
                                  enforcement: {
                                    ...current.enforcement,
                                    fallbackBehavior: event.target.value as AgentSandboxConfig['enforcement']['fallbackBehavior'],
                                  },
                                }
                              : current,
                          )
                        }
                        title={tooltip('agents.sandbox.test.fallback')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="deny">Deny</option>
                        <option value="allow">Allow</option>
                      </select>
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <div className="mb-2">Mandatory capabilities</div>
                      <input
                        type="text"
                        value={sandboxConfig.enforcement.mandatoryForCapabilities.join(', ')}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current
                              ? {
                                  ...current,
                                  enforcement: {
                                    ...current.enforcement,
                                    mandatoryForCapabilities: event.target.value
                                      .split(',')
                                      .map((value) => value.trim())
                                      .filter(Boolean),
                                  },
                                }
                              : current,
                          )
                        }
                        placeholder="exec, process, write"
                        title={tooltip('agents.sandbox.test.mandatoryCapabilities')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                  </div>

                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <div className="mb-2">Overrides JSON</div>
                    <textarea
                      value={sandboxOverridesText}
                      onChange={(event) => setSandboxOverridesText(event.target.value)}
                      title={tooltip('agents.sandbox.test.overridesJson')}
                      className="min-h-[220px] w-full rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-100 outline-none"
                    />
                  </label>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void validateSandboxConfigNow()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.validate')}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
                    >
                      Validate
                    </button>
                    <button
                      type="button"
                      onClick={() => void runSandboxDryRun()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.dryRun')}
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                    >
                      Dry-run
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveSandboxConfig()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.save')}
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => void runSandboxExecution()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.runTest')}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50"
                    >
                      Run Test
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-200">Policy Preview</div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                        (sandboxDryRun?.riskLevel || selectedSandboxProfile?.riskLevel || 'low') === 'critical'
                          ? 'border-red-400/40 text-red-200'
                          : (sandboxDryRun?.riskLevel || selectedSandboxProfile?.riskLevel || 'low') === 'high'
                            ? 'border-orange-400/40 text-orange-200'
                            : 'border-slate-700 text-slate-300'
                      }`}>
                        {(sandboxDryRun?.riskLevel || selectedSandboxProfile?.riskLevel || 'low').toString()}
                      </span>
                    </div>
                    <pre className="max-h-[240px] overflow-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-[11px] text-slate-300">
                      {JSON.stringify(
                        sandboxDryRun?.effectivePolicy
                        || buildSandboxPreviewConfig(
                          sandboxConfig,
                          selectedSandboxProfile?.config || null,
                          parseSandboxOverrides(sandboxOverridesText),
                        ),
                        null,
                        2,
                      )}
                    </pre>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Validation</div>
                    <div className="space-y-2">
                      {(sandboxValidation?.issues || []).map((issue, index) => (
                        <div
                          key={`${issue.field}-${index}`}
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            issue.severity === 'error'
                              ? 'border-red-500/20 bg-red-500/10 text-red-100'
                              : 'border-amber-500/20 bg-amber-500/10 text-amber-100'
                          }`}
                        >
                          <div className="font-semibold">{issue.field}</div>
                          <div className="mt-1 text-xs opacity-90">{issue.message}</div>
                        </div>
                      ))}
                      {(!sandboxValidation || sandboxValidation.issues.length === 0) && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
                          Nenhuma validacao executada ainda.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Dry-run Result</div>
                    {sandboxDryRun ? (
                      <div className="space-y-2 text-sm text-slate-300">
                        <div>Allowed: {String(sandboxDryRun.allowed)}</div>
                        <div>Approval required: {String(sandboxDryRun.requiresApproval)}</div>
                        {sandboxDryRun.reasons.length > 0 && (
                          <div className="space-y-2">
                            {sandboxDryRun.reasons.slice(0, 4).map((reason) => (
                              <div key={reason} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-400">
                                {reason}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">Executa um dry-run para visualizar a policy efetiva.</div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Recent Executions</div>
                    <div className="space-y-2">
                      {sandboxExecutions.slice(0, 5).map((execution) => (
                        <div key={execution.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                          <div className="text-sm text-white">{execution.capability}</div>
                          <div className="mt-1 text-xs text-slate-500">{execution.status}</div>
                        </div>
                      ))}
                      {sandboxExecutions.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                          Nenhuma execucao de sandbox registrada para este agente.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!loading && activeTab === 'sandbox' && !sandboxConfig && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                A configuracao de sandbox ainda nao foi carregada.
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
                      title={tooltip('agents.chat.input')}
                      placeholder="Send a request directly to this agent..."
                      className="min-h-[120px] w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-100 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        title={tooltip('agents.chat.send')}
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

function TabButton({ active, icon, label, onClick, title }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
        active ? 'border-indigo-400/60 bg-indigo-500/10 text-indigo-100' : 'border-slate-700 text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SandboxEditorCard({ title, children }: { title: string; children: React.ReactNode }) {
  const tooltip = useTooltipText();
  const tooltipKey = sandboxCardTooltipKeys[title] || 'agents.sandbox.field';

  return (
    <div title={tooltip(tooltipKey)} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SandboxToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const tooltip = useTooltipText();

  return (
    <label title={tooltip('agents.sandbox.field')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-indigo-400"
      />
    </label>
  );
}

function parseSandboxOverrides(value: string): Record<string, unknown> {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function buildSandboxPreviewConfig(
  config: AgentSandboxConfig,
  selectedProfileConfig: Partial<SandboxConfig> | null,
  overrides: Record<string, unknown>,
): SandboxConfig {
  const base = selectedProfileConfig || {
    enabled: config.enabled,
    mode: config.profileId ? 'process' : 'process',
    filesystem: {
      readOnlyRoot: true,
      workingDirectory: '/workspace',
      allowedReadPaths: ['/workspace'],
      allowedWritePaths: ['/workspace/output'],
      tempDirectory: '/workspace/tmp',
      persistArtifacts: true,
    },
    network: {
      mode: 'off',
      blockPrivateNetworks: true,
      allowDns: false,
      httpOnly: true,
    },
    resources: {
      timeoutSeconds: 60,
      cpuLimit: 1,
      memoryMb: 512,
      diskMb: 512,
      maxProcesses: 8,
      maxThreads: 8,
      maxStdoutKb: 256,
      maxStderrKb: 256,
    },
    execution: {
      allowShell: false,
      allowedBinaries: ['node', 'python', 'python3', 'bash'],
      blockedBinaries: ['sudo', 'su', 'ssh', 'scp', 'docker', 'kubectl'],
      allowedInterpreters: ['node', 'python', 'python3'],
      allowSubprocessSpawn: false,
      allowPackageInstall: false,
    },
    environment: {
      runtime: 'node',
      runtimeVersion: '20',
      envVars: {},
      inheritHostEnv: false,
      secretInjection: false,
      timezone: 'UTC',
      locale: 'en-US',
    },
    security: {
      runAsNonRoot: true,
      noNewPrivileges: true,
      disableDeviceAccess: true,
      disablePrivilegedMode: true,
      disableHostNamespaces: true,
    },
    ioPolicy: {
      maxInputSizeKb: 256,
      maxOutputSizeKb: 512,
      allowedOutputTypes: ['text', 'json', 'file'],
      stripSensitiveOutput: true,
      contentScan: true,
      retention: 'task',
    },
    audit: {
      enabled: true,
      captureCommand: true,
      captureStdout: true,
      captureStderr: true,
      captureExitCode: true,
      captureArtifacts: true,
      captureTiming: true,
      captureHashes: true,
      capturePolicySnapshot: true,
      captureNetworkEvents: false,
    },
    approvals: {
      requireApprovalForExec: true,
      requireApprovalForWriteOutsideWorkspace: true,
      requireApprovalForNetwork: true,
      requireApprovalForLargeArtifacts: false,
    },
  };

  return deepMergePreviewConfig(base, {
    enabled: config.enabled,
    ...overrides,
  });
}

function buildSandboxExecutionPayload(
  agentId: string,
  capability: string,
  commandText: string,
  sandboxConfig: AgentSandboxConfig | null,
  profiles: SandboxProfile[],
  overrides: Record<string, unknown>,
) {
  const selectedProfile = sandboxConfig?.profileId
    ? profiles.find((profile) => profile.id === sandboxConfig.profileId)
    : null;

  return {
    agentId,
    capability,
    command: commandText.split(/\s+/).filter(Boolean),
    requestedPaths: ['/workspace'],
    taskId: undefined,
    skillId: undefined,
    skillRequirements: selectedProfile ? selectedProfile.config : undefined,
    temporaryOverrides: overrides as any,
  };
}

function deepMergePreviewConfig(base: any, patch: any): any {
  const result = Array.isArray(base) ? [...base] : { ...base };

  for (const [key, value] of Object.entries(patch || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      result[key] = deepMergePreviewConfig(base[key], value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

function setNestedValue(source: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const next = { ...source };
  let cursor: Record<string, unknown> = next;

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const current = cursor[key];
    cursor[key] = current && typeof current === 'object' && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[path[path.length - 1]] = value;
  return next;
}

function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitCommaNumberList(value: string): number[] {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}
