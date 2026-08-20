import { z } from "zod";

const positionSchema = z.object({ x: z.number(), y: z.number() });
const nodeDataSchema = z.object({ label: z.string().max(160), description: z.string().max(2000), assignee: z.string().max(160), duration: z.string().max(80) });
export const workflowNodeSchema = z.object({ id: z.string().min(1).max(120), type: z.enum(["start", "task", "approval", "condition", "end"]), position: positionSchema, data: nodeDataSchema }).passthrough();
export const workflowEdgeSchema = z.object({ id: z.string().min(1).max(120), source: z.string().min(1).max(120), target: z.string().min(1).max(120), sourceHandle: z.string().nullable().optional(), targetHandle: z.string().nullable().optional() }).passthrough();
export const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) });
export const processCreateSchema = z.object({ workspaceId: z.uuid(), name: z.string().trim().min(1).max(160), nodes: z.array(workflowNodeSchema).max(500).default([]), edges: z.array(workflowEdgeSchema).max(1000).default([]) });
export const processUpdateSchema = z.object({ name: z.string().trim().min(1).max(160), nodes: z.array(workflowNodeSchema).max(500), edges: z.array(workflowEdgeSchema).max(1000), expectedVersion: z.number().int().positive().optional() });
