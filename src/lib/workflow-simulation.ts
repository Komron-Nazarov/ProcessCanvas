import type { WorkflowEdge } from "@/types/workflow";

export function nextSimulationNode(currentId: string, edges: WorkflowEdge[], branch?: "yes" | "no") {
  const edge = edges.find((item) => item.source === currentId && (!branch || item.sourceHandle === branch));
  return edge?.target ?? null;
}
