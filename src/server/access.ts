import { and, eq } from "drizzle-orm";
import { getDatabase } from "./db/client";
import { processes, workspaceMembers } from "./db/schema";

export async function requireWorkspaceAccess(userId: string, workspaceId: string, write = false) {
  const db = getDatabase();
  const [membership] = await db.select({ role: workspaceMembers.role }).from(workspaceMembers).where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId))).limit(1);
  if (!membership || (write && membership.role === "viewer")) throw new Error("FORBIDDEN");
  return membership;
}

export async function requireProcessAccess(userId: string, processId: string, write = false) {
  const db = getDatabase();
  const [row] = await db.select({ process: processes, role: workspaceMembers.role }).from(processes).innerJoin(workspaceMembers, and(eq(workspaceMembers.workspaceId, processes.workspaceId), eq(workspaceMembers.userId, userId))).where(eq(processes.id, processId)).limit(1);
  if (!row) throw new Error("NOT_FOUND");
  if (write && row.role === "viewer") throw new Error("FORBIDDEN");
  return row.process;
}
