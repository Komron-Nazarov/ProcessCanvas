import type { Workflow } from "@/types/workflow";

export const demoWorkflow: Workflow = {
  id: "purchase-approval",
  name: "Purchase approval",
  status: "draft",
  updatedAt: new Date().toISOString(),
  nodes: [
    { id: "start", type: "start", position: { x: 40, y: 190 }, data: { label: "Request received", description: "A purchase need is identified", assignee: "", duration: "" } },
    { id: "create", type: "task", position: { x: 270, y: 190 }, data: { label: "Create purchase request", description: "Add vendor, items and business reason", assignee: "Requester", duration: "30 min" } },
    { id: "manager", type: "approval", position: { x: 540, y: 190 }, data: { label: "Manager approval", description: "Validate need and available budget", assignee: "Department manager", duration: "4 hours" } },
    { id: "limit", type: "condition", position: { x: 820, y: 180 }, data: { label: "Amount above limit?", description: "Route purchases above $5,000", assignee: "", duration: "" } },
    { id: "director", type: "approval", position: { x: 1090, y: 75 }, data: { label: "Director approval", description: "Approve high-value purchase", assignee: "Finance director", duration: "1 day" } },
    { id: "approved", type: "task", position: { x: 1090, y: 300 }, data: { label: "Mark as approved", description: "Notify requester and procurement", assignee: "Procurement", duration: "15 min" } },
    { id: "end", type: "end", position: { x: 1380, y: 190 }, data: { label: "Purchase approved", description: "Request is ready for ordering", assignee: "", duration: "" } },
  ],
  edges: [
    { id: "e-start-create", source: "start", target: "create", type: "smoothstep" },
    { id: "e-create-manager", source: "create", target: "manager", type: "smoothstep" },
    { id: "e-manager-limit", source: "manager", target: "limit", type: "smoothstep" },
    { id: "e-limit-director", source: "limit", sourceHandle: "yes", target: "director", label: "Yes", type: "smoothstep" },
    { id: "e-limit-approved", source: "limit", sourceHandle: "no", target: "approved", label: "No", type: "smoothstep" },
    { id: "e-director-end", source: "director", target: "end", type: "smoothstep" },
    { id: "e-approved-end", source: "approved", target: "end", type: "smoothstep" },
  ],
};
