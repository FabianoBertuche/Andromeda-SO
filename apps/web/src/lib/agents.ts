export interface AgentSummary {
  id: string;
  name: string;
  role: string;
  category: string;
  teamId: string;
  status: 'active' | 'archived';
  type: string;
  defaultModel: string;
  profileVersion: string;
  identityActive: boolean;
  recentConformanceScore?: number;
  lastExecutionAt?: string;
}

export interface AgentBehaviorConfig {
  formality: number;
  warmth: number;
  objectivity: number;
  detailLevel: number;
  caution: number;
  autonomy: number;
  creativity: number;
  ambiguityTolerance: number;
  proactivity: number;
  delegationTendency: number;
  feedbackFrequency: number;
  playbookStrictness: number;
  complianceStrictness: number;
  selfReviewIntensity: number;
  evidenceRequirements: number;
}

export interface AgentSafeguardConfig {
  mode: 'strict' | 'balanced' | 'flexible';
  minOverallConformance: number;
  requireAuditOnCriticalTasks: boolean;
  alwaysProvideIntermediateFeedback: boolean;
  preferSpecialistDelegation: boolean;
  blockOutOfRoleResponses: boolean;
  runSelfReview: boolean;
  prioritizeSkillFirst: boolean;
  alwaysSuggestNextSteps: boolean;
  correctiveAction: 'allow_with_notice' | 'rewrite' | 'fallback' | 'block';
  fallbackAgentId?: string;
  activePolicies: string[];
}

export interface AgentMarkdownSections {
  identity: string;
  soul: string;
  rules: string;
  playbook: string;
  context: string;
}

export interface AgentProfileDocument {
  id: string;
  version: string;
  status: 'active' | 'archived';
  description: string;
  teamId: string;
  category: string;
  type: string;
  defaultModel: string;
  isDefault: boolean;
  identity: {
    name: string;
    role: string;
    mission: string;
    scope: string;
    communicationStyle: string;
    ecosystemRole: string;
    agentType: string;
    specializations: string[];
  };
  markdown: AgentMarkdownSections;
  persona: AgentBehaviorConfig;
  safeguards: AgentSafeguardConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfileHistoryEntry {
  version: string;
  updatedAt: string;
  summary: string;
  restoredFromVersion?: string;
}

export interface AgentConformanceExecution {
  overallConformanceScore: number;
  status: string;
  selectedModel: string;
  createdAt: string;
  violations: string[];
}

export interface AgentConformanceView {
  agentId: string;
  averageOverallConformanceScore?: number;
  lastExecutionAt?: string;
  recentExecutions: AgentConformanceExecution[];
  recentViolations: string[];
}

export interface AgentHistoryItem {
  taskId: string;
  sessionId?: string;
  prompt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  audit?: {
    overallConformanceScore: number;
    status: string;
  };
}

export interface AgentChatResponse {
  taskId: string;
  status: string;
  sessionId?: string;
  result?: {
    content?: string;
    model?: string;
    agent?: {
      id: string;
      name: string;
      role: string;
      version: string;
    };
    audit?: {
      overallConformanceScore: number;
      status: string;
      violations: string[];
    };
  };
  audit?: {
    overallConformanceScore: number;
    status: string;
    violations: string[];
  };
}

export async function listAgents(): Promise<AgentSummary[]> {
  const response = await fetch('/agents');
  ensureOk(response, 'Falha ao listar agentes.');
  return response.json() as Promise<AgentSummary[]>;
}

export async function getAgentProfile(id: string): Promise<AgentProfileDocument> {
  const response = await fetch(`/agents/${id}/profile`);
  ensureOk(response, 'Falha ao carregar o perfil do agente.');
  return response.json() as Promise<AgentProfileDocument>;
}

export async function updateAgentProfile(id: string, payload: Partial<AgentProfileDocument>): Promise<AgentProfileDocument> {
  const response = await fetch(`/agents/${id}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao salvar o perfil do agente.');
  return response.json() as Promise<AgentProfileDocument>;
}

export async function getAgentProfileHistory(id: string): Promise<AgentProfileHistoryEntry[]> {
  const response = await fetch(`/agents/${id}/profile/history`);
  ensureOk(response, 'Falha ao carregar o historico do perfil.');
  return response.json() as Promise<AgentProfileHistoryEntry[]>;
}

export async function restoreAgentProfileVersion(id: string, version: string): Promise<AgentProfileDocument> {
  const response = await fetch(`/agents/${id}/profile/restore/${version}`, {
    method: 'POST',
  });
  ensureOk(response, 'Falha ao restaurar a versao do perfil.');
  return response.json() as Promise<AgentProfileDocument>;
}

export async function getAgentBehavior(id: string): Promise<AgentBehaviorConfig> {
  const response = await fetch(`/agents/${id}/behavior`);
  ensureOk(response, 'Falha ao carregar os parametros comportamentais.');
  return response.json() as Promise<AgentBehaviorConfig>;
}

export async function updateAgentBehavior(id: string, payload: Partial<AgentBehaviorConfig>): Promise<AgentBehaviorConfig> {
  const response = await fetch(`/agents/${id}/behavior`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao salvar os parametros comportamentais.');
  return response.json() as Promise<AgentBehaviorConfig>;
}

export async function getAgentSafeguards(id: string): Promise<AgentSafeguardConfig> {
  const response = await fetch(`/agents/${id}/safeguards`);
  ensureOk(response, 'Falha ao carregar as safeguards.');
  return response.json() as Promise<AgentSafeguardConfig>;
}

export async function updateAgentSafeguards(id: string, payload: Partial<AgentSafeguardConfig>): Promise<AgentSafeguardConfig> {
  const response = await fetch(`/agents/${id}/safeguards`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao salvar as safeguards.');
  return response.json() as Promise<AgentSafeguardConfig>;
}

export async function getAgentConformance(id: string): Promise<AgentConformanceView> {
  const response = await fetch(`/agents/${id}/conformance`);
  ensureOk(response, 'Falha ao carregar a conformidade do agente.');
  return response.json() as Promise<AgentConformanceView>;
}

export async function getAgentHistory(id: string): Promise<AgentHistoryItem[]> {
  const response = await fetch(`/agents/${id}/history`);
  ensureOk(response, 'Falha ao carregar o historico do agente.');
  return response.json() as Promise<AgentHistoryItem[]>;
}

export async function chatWithAgent(id: string, payload: { prompt: string; sessionId?: string; modelId?: string; interactionMode?: string; }): Promise<AgentChatResponse> {
  const response = await fetch(`/agents/${id}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao conversar com o agente.');
  return response.json() as Promise<AgentChatResponse>;
}

function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return;
  }

  throw new Error(fallbackMessage);
}
