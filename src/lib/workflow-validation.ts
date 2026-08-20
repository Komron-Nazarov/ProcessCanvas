import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type ValidationCode = "start_count" | "end_missing" | "required_name" | "incoming_missing" | "outgoing_missing" | "condition_branches" | "unreachable";
export type ValidationIssue = { code: ValidationCode; nodeId?: string };

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const issues: ValidationIssue[] = [];
  const starts = nodes.filter((node) => node.type === "start");
  if (starts.length !== 1) issues.push({ code: "start_count" });
  if (!nodes.some((node) => node.type === "end")) issues.push({ code: "end_missing" });
  const incoming = new Map<string, WorkflowEdge[]>();
  const outgoing = new Map<string, WorkflowEdge[]>();
  edges.forEach((edge) => { incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]); outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]); });
  nodes.forEach((node) => {
    if (!node.data.label.trim()) issues.push({ code: "required_name", nodeId: node.id });
    if (node.type !== "start" && !(incoming.get(node.id)?.length)) issues.push({ code: "incoming_missing", nodeId: node.id });
    if (node.type !== "end" && !(outgoing.get(node.id)?.length)) issues.push({ code: "outgoing_missing", nodeId: node.id });
    if (node.type === "condition") {
      const branchEdges = outgoing.get(node.id) ?? [];
      if (!branchEdges.some((edge) => edge.sourceHandle === "yes") || !branchEdges.some((edge) => edge.sourceHandle === "no")) issues.push({ code: "condition_branches", nodeId: node.id });
    }
  });
  if (starts.length === 1) {
    const reachable = new Set<string>();
    const queue = [starts[0].id];
    while (queue.length) { const id = queue.shift(); if (!id || reachable.has(id)) continue; reachable.add(id); (outgoing.get(id) ?? []).forEach((edge) => queue.push(edge.target)); }
    nodes.filter((node) => !reachable.has(node.id)).forEach((node) => issues.push({ code: "unreachable", nodeId: node.id }));
  }
  return { valid: issues.length === 0, issues, nodeIds: new Set(issues.flatMap((issue) => issue.nodeId ? [issue.nodeId] : [])) };
}
