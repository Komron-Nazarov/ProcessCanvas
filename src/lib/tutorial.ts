import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export const TUTORIAL_TOTAL_STEPS = 9;
export type TutorialEvent = "edit" | "undo" | "redo" | "autosave";
export type TutorialEvents = Record<TutorialEvent, boolean>;

export const emptyTutorialEvents = (): TutorialEvents => ({ edit: false, undo: false, redo: false, autosave: false });

function hasConnectedTypes(nodes: WorkflowNode[], edges: WorkflowEdge[], sourceType: string, targetType: string) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  return edges.some((edge) => nodeById.get(edge.source)?.type === sourceType && nodeById.get(edge.target)?.type === targetType);
}

export function isTutorialStepComplete(step: number, nodes: WorkflowNode[], edges: WorkflowEdge[], events: TutorialEvents) {
  if (step === 0) return nodes.some((node) => node.type === "start");
  if (step === 1) return nodes.some((node) => node.type === "task");
  if (step === 2) return hasConnectedTypes(nodes, edges, "start", "task");
  if (step === 3) return events.edit && nodes.some((node) => node.type === "task" && node.data.label.trim().length > 0 && node.data.description.trim().length > 0);
  if (step === 4) return nodes.some((node) => node.type === "approval");
  if (step === 5) {
    const condition = nodes.find((node) => node.type === "condition");
    if (!condition) return false;
    const outgoing = edges.filter((edge) => edge.source === condition.id);
    return outgoing.some((edge) => edge.sourceHandle === "yes") && outgoing.some((edge) => edge.sourceHandle === "no");
  }
  if (step === 6) return events.undo && events.redo;
  if (step === 7) return events.autosave;
  return false;
}
