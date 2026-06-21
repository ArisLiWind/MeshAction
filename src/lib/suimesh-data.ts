export type ActionType = "transfer" | "contract_call" | "copy_trade";

export type AgentKind = "hosted" | "byo";

export type WorkflowNodeType =
  | "user"
  | "agent"
  | "memory"
  | "policy"
  | "executor"
  | "sui"
  | "walrus"
  | "audit";

export type NodeStatus =
  | "idle"
  | "ready"
  | "running"
  | "blocked"
  | "approved"
  | "executed"
  | "archived";

export type AgentManifest = {
  agent_id: string;
  display_name: string;
  kind: AgentKind;
  capabilities: string[];
  supported_semantic_types: ActionType[];
  endpoint: string;
  signing_address: string;
  memory_provider: string;
  required_policy_checks: string[];
  identity_verified?: boolean;
  verified_at_ms?: number;
  enabled?: boolean;
};

export type WorkflowNode = {
  node_id: string;
  type: WorkflowNodeType;
  label: string;
  session_id: string;
  trace_id?: string;
  status: NodeStatus;
  metadata: {
    headline: string;
    details: string;
    capabilities?: string[];
    policy?: string[];
    permissions?: string[];
    refs?: string[];
    audit?: string[];
  };
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type TraceEvent = {
  id: string;
  label: string;
  actor: string;
  status: NodeStatus;
  timestamp: string;
  summary: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "agent" | "system";
  author: string;
  body: string;
  timestamp: string;
  trace_id?: string;
};

export type ActionDefinition = {
  value: ActionType;
  label: string;
  semantic_type: ActionType;
  objective: string;
  risk: "low" | "medium" | "high";
  proposal: string;
  policy_checks: string[];
};

const TEMPLATE_SESSION_ID = "runtime_template";
const TEMPLATE_TRACE_ID = "trace_template";

export const actionDefinitions: Record<ActionType, ActionDefinition> = {
  transfer: {
    value: "transfer",
    label: "Transfer",
    semantic_type: "transfer",
    objective:
      "Send 0.01 SUI to a verified testnet recipient before the quote expires.",
    risk: "medium",
    proposal:
      "Transfer 0.01 SUI to the configured testnet recipient after recipient and expiry checks.",
    policy_checks: [
      "recipient_allowlist",
      "amount_limit_lte_5_sui",
      "expires_at_before_10m",
      "inspected_ptb_facts",
    ],
  },
  contract_call: {
    value: "contract_call",
    label: "Contract call",
    semantic_type: "contract_call",
    objective: "Call the demo Move module to mint a verifiable action marker.",
    risk: "low",
    proposal:
      "Call allowlisted testnet demo_action::mark_action with the session trace id.",
    policy_checks: [
      "package_allowlist",
      "module_function_allowlist",
      "object_touch_set",
      "simulation_success",
    ],
  },
  copy_trade: {
    value: "copy_trade",
    label: "Copy trade",
    semantic_type: "copy_trade",
    objective: "Rebuild a follower PTB from a leader source PTB under user limits.",
    risk: "high",
    proposal:
      "Mirror the verified leader trace into an on-chain follower copy-trade event with max exposure 12 SUI.",
    policy_checks: [
      "leader_trace_verified",
      "max_exposure_limit",
      "package_function_allowlist",
      "claim_not_duplicate",
    ],
  },
};

export const agentManifests: AgentManifest[] = [
  {
    agent_id: "agent_hosted_orchestrator",
    display_name: "Hosted Orchestrator",
    kind: "hosted",
    capabilities: ["intent_parse", "proposal_build", "trace_link"],
    supported_semantic_types: ["transfer", "contract_call", "copy_trade"],
    endpoint: "hosted://runtime/orchestrator",
    signing_address: "0x4f6f...d1a9",
    memory_provider: "seal://session-memory/default",
    required_policy_checks: ["manifest_match", "semantic_type_supported"],
  },
  {
    agent_id: "agent_policy_sentinel",
    display_name: "Policy Sentinel",
    kind: "hosted",
    capabilities: ["ptb_inspect", "simulate", "decision_emit"],
    supported_semantic_types: ["transfer", "contract_call", "copy_trade"],
    endpoint: "hosted://runtime/policy",
    signing_address: "0x92ab...02fe",
    memory_provider: "none",
    required_policy_checks: ["inspected_facts_only", "requires_confirmation"],
  },
  {
    agent_id: "agent_meshaction_proposal",
    display_name: "MeshAction Proposal Agent",
    kind: "hosted",
    capabilities: ["intent_to_proposal", "agent_message", "proposal_event"],
    supported_semantic_types: ["transfer", "contract_call", "copy_trade"],
    endpoint: "hosted://runtime/meshaction-proposal",
    signing_address: "meshaction://proposal",
    memory_provider: "none",
    required_policy_checks: ["manifest_match", "inspected_facts_only"],
  },
  {
    agent_id: "agent_meshaction_auditor",
    display_name: "MeshAction Audit Agent",
    kind: "hosted",
    capabilities: ["proposal_review", "facts_audit", "approval_event"],
    supported_semantic_types: ["transfer", "contract_call", "copy_trade"],
    endpoint: "hosted://runtime/meshaction-auditor",
    signing_address: "meshaction://audit",
    memory_provider: "none",
    required_policy_checks: ["inspected_facts_only", "policy_decision_required"],
  },
  {
    agent_id: "agent_byo_runtime_adapter",
    display_name: "BYO Runtime Adapter",
    kind: "byo",
    capabilities: [
      "event_envelope",
      "proposal",
      "ptb_action",
      "follower_ptb",
      "receipt_sign",
    ],
    supported_semantic_types: ["transfer", "contract_call", "copy_trade"],
    endpoint: "byo://unregistered/runtime-adapter",
    signing_address: "0xa671...804c",
    memory_provider: "external://agent-memory/runtime",
    required_policy_checks: ["registered_identity", "signature_valid"],
    identity_verified: false,
  },
];

export function getWorkflowGraph(action: ActionType = "transfer"): WorkflowGraph {
  const definition = actionDefinitions[action];
  const selectedAgent = agentManifests[0];

  const nodes: WorkflowNode[] = [
    {
      node_id: "node_user",
      type: "user",
      label: "User",
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "ready",
      metadata: {
        headline: "Intent source",
        details: definition.objective,
        refs: ["session://pending", "trace://pending"],
      },
    },
    {
      node_id: "node_agent",
      type: "agent",
      label: selectedAgent.display_name,
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "ready",
      metadata: {
        headline: `${selectedAgent.kind.toUpperCase()} agent`,
        details: definition.proposal,
        capabilities: selectedAgent.capabilities,
        policy: selectedAgent.required_policy_checks,
        refs: [selectedAgent.agent_id, selectedAgent.endpoint],
      },
    },
    {
      node_id: "node_memory",
      type: "memory",
      label: "Memory",
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "ready",
      metadata: {
        headline: "Context refs only",
        details:
          "Platform cache stores session index and layout; full context resolves through SuiMesh, Walrus, Sui, and Seal.",
        refs: ["seal://session-memory/default", "cache://trace-summary"],
      },
    },
    {
      node_id: "node_policy",
      type: "policy",
      label: "Policy",
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "idle",
      metadata: {
        headline: "Awaiting policy evaluation",
        details: "Policy only approves inspected and simulated PTB facts.",
        policy: definition.policy_checks,
      },
    },
    {
      node_id: "node_executor",
      type: "executor",
      label: "Executor",
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "idle",
      metadata: {
        headline: "Claim guarded",
        details:
          "Hosted executor cannot execute until a policy decision is approved and claim succeeds.",
        permissions: ["claim_once", "execute_testnet", "publish_receipt"],
      },
    },
    {
      node_id: "node_sui",
      type: "sui",
      label: "Sui",
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "idle",
      metadata: {
        headline: "Awaiting execution",
        details: "No Sui transaction has been submitted for this trace.",
        refs: ["effects://pending", "network://sui-testnet"],
      },
    },
    {
      node_id: "node_walrus",
      type: "walrus",
      label: "Walrus",
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "idle",
      metadata: {
        headline: "Archive pending",
        details:
          "Trace archive will store encrypted context and proof refs, not mutable platform cache state.",
        refs: ["walrus://pending", "seal://pending"],
      },
    },
    {
      node_id: "node_audit",
      type: "audit",
      label: "Audit",
      session_id: TEMPLATE_SESSION_ID,
      trace_id: TEMPLATE_TRACE_ID,
      status: "idle",
      metadata: {
        headline: "Verification chain",
        details:
          "Restores Intent -> Proposal -> Action -> PolicyDecision -> Claim -> Receipt -> Audit.",
        audit: [
          "duplicate claim blocked",
          "manifest identity checked",
          "db cache tamper ignored",
        ],
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    {
      id: "e_user_agent",
      source: "node_user",
      target: "node_agent",
      label: "intent",
    },
    {
      id: "e_agent_memory",
      source: "node_agent",
      target: "node_memory",
      label: "context refs",
    },
    {
      id: "e_agent_policy",
      source: "node_agent",
      target: "node_policy",
      label: "proposal + PTB",
    },
    {
      id: "e_policy_executor",
      source: "node_policy",
      target: "node_executor",
      label: "decision",
    },
    {
      id: "e_executor_sui",
      source: "node_executor",
      target: "node_sui",
      label: "claim + execute",
    },
    {
      id: "e_sui_walrus",
      source: "node_sui",
      target: "node_walrus",
      label: "receipt",
    },
    {
      id: "e_walrus_audit",
      source: "node_walrus",
      target: "node_audit",
      label: "archive refs",
    },
  ];

  return { nodes, edges };
}

export function isActionType(value: unknown): value is ActionType {
  return (
    value === "transfer" ||
    value === "contract_call" ||
    value === "copy_trade"
  );
}
