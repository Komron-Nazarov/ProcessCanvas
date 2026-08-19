import type { Edge, Node } from "@xyflow/react";

export type WorkflowNodeType = "start" | "task" | "approval" | "condition" | "end";

export type WorkflowNodeData = {
  label: string;
  description: string;
  assignee: string;
  duration: string;
};

export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;
export type WorkflowEdge = Edge;

export type Workflow = {
  id: string;
  name: string;
  status: "draft" | "active" | "archived";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: string;
};

export const NODE_DEFAULTS: Record<WorkflowNodeType, WorkflowNodeData> = {
  start: { label: "Start", description: "Entry point for this process", assignee: "", duration: "" },
  task: { label: "New task", description: "Describe what needs to happen", assignee: "Unassigned", duration: "1 day" },
  approval: { label: "Approval", description: "Review and approve the request", assignee: "Manager", duration: "4 hours" },
  condition: { label: "Condition", description: "Choose the path based on a rule", assignee: "", duration: "" },
  end: { label: "End", description: "Process completed", assignee: "", duration: "" },
};
