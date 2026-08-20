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
