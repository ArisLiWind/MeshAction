"use client";

import { memo, useMemo } from "react";
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import {
  Archive,
  Bot,
  BrainCircuit,
  FileCheck2,
  Landmark,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import type {
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeType,
} from "@/lib/suimesh-data";
import { cn } from "@/lib/utils";

type MeshNodeData = Record<string, unknown> & {
  node: WorkflowNode;
  selected: boolean;
  onSelectNode: (nodeId: string) => void;
};

type MeshFlowNode = Node<MeshNodeData, "mesh">;

const nodeIcon: Record<WorkflowNodeType, typeof UserRound> = {
  user: UserRound,
  agent: Bot,
  memory: BrainCircuit,
  policy: ShieldCheck,
  executor: WalletCards,
  sui: Landmark,
  walrus: Archive,
  audit: FileCheck2,
};

const statusTone: Record<WorkflowNode["status"], string> = {
  idle: "border-slate-200 bg-slate-50 text-slate-500",
  ready: "border-slate-300 bg-white text-slate-900",
  running: "border-blue-200 bg-blue-50 text-slate-950",
  blocked: "border-amber-200 bg-amber-50 text-slate-950",
  approved: "border-emerald-200 bg-emerald-50 text-slate-950",
  executed: "border-emerald-300 bg-emerald-50 text-slate-950",
  archived: "border-slate-300 bg-slate-50 text-slate-700",
};

const positions: Record<string, { x: number; y: number }> = {
  node_user: { x: 0, y: 44 },
  node_agent: { x: 190, y: 44 },
  node_policy: { x: 380, y: 44 },
  node_executor: { x: 190, y: 188 },
  node_sui: { x: 380, y: 188 },
  node_memory: { x: 0, y: 188 },
  node_walrus: { x: 190, y: 332 },
  node_audit: { x: 380, y: 332 },
};

const MeshNodeCard = memo(function MeshNodeCard({
  data,
}: NodeProps<MeshFlowNode>) {
  const { node, selected, onSelectNode } = data;
  const Icon = nodeIcon[node.type];

  return (
    <button
      type="button"
      onClick={() => onSelectNode(node.node_id)}
      className={cn(
        "min-w-40 rounded-lg border px-3 py-2 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]",
        statusTone[node.status],
        selected && "ring-2 ring-blue-500/25"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="border-white bg-[color:var(--mesh-system-blue)]"
      />
      <div className="flex items-start gap-2">
        <span className="mt-0.5 rounded-md bg-slate-100 p-1 text-slate-600 ring-1 ring-slate-200">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{node.label}</span>
          <span className="mt-0.5 block truncate font-mono text-[11px] uppercase text-slate-500">
            {node.status}
          </span>
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
        {node.metadata.headline}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="border-white bg-[color:var(--mesh-system-blue)]"
      />
    </button>
  );
});

const nodeTypes = { mesh: MeshNodeCard } satisfies NodeTypes;

export function WorkflowGraph({
  graphNodes,
  graphEdges,
  selectedNodeId,
  onSelectNode,
}: {
  graphNodes: WorkflowNode[];
  graphEdges: WorkflowEdge[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}) {
  const nodes = useMemo<MeshFlowNode[]>(
    () =>
      graphNodes.map((node) => ({
        id: node.node_id,
        type: "mesh",
        position: positions[node.node_id] ?? { x: 0, y: 0 },
        data: {
          node,
          selected: selectedNodeId === node.node_id,
          onSelectNode,
        },
      })),
    [graphNodes, onSelectNode, selectedNodeId]
  );

  const edges = useMemo<Edge[]>(
    () =>
      graphEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.id !== "e_sui_walrus" && edge.id !== "e_walrus_audit",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5 },
        labelStyle: {
          fill: "rgba(71,85,105,0.82)",
          fontSize: 11,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: "rgba(255,255,255,0.9)",
          fillOpacity: 0.95,
        },
      })),
    [graphEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.54}
      maxZoom={1.35}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
      className="h-full w-full rounded-lg"
    >
      <Background gap={18} color="rgba(148,163,184,0.22)" />
    </ReactFlow>
  );
}
