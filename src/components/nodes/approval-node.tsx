import type { NodeProps } from "@xyflow/react";
import type { WorkflowNode } from "@/types/workflow";
import { ProcessNode } from "./process-node";
export function ApprovalNode(props: NodeProps<WorkflowNode>) { return <ProcessNode {...props} />; }
