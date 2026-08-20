import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { users, workspaceMembers, workspaces } from "@/server/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null, workspace: null });
  const db = getDatabase();
  const [row] = await db.select({ id: users.id, name: users.name, email: users.email, workspaceId: workspaces.id, workspaceName: workspaces.name, role: workspaceMembers.role }).from(users).innerJoin(workspaceMembers, eq(workspaceMembers.userId, users.id)).innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId)).where(eq(users.id, session.userId)).limit(1);
  if (!row) return NextResponse.json({ user: null, workspace: null });
  return NextResponse.json({ user: { id: row.id, name: row.name, email: row.email }, workspace: { id: row.workspaceId, name: row.workspaceName, role: row.role } });
}
