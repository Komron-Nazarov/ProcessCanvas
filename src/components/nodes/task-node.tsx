import type { NodeProps } from "@xyflow/react";
import type { WorkflowNode } from "@/types/workflow";
import { ProcessNode } from "./process-node";
export function TaskNode(props: NodeProps<WorkflowNode>) { return <ProcessNode {...props} />; }
