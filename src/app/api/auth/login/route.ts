import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiError } from "@/server/api";
import { createSession } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { users, workspaceMembers, workspaces } from "@/server/db/schema";
import { loginSchema } from "@/server/validation";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const db = getDatabase();
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user || !(await compare(input.password, user.passwordHash))) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    const [membership] = await db.select({ workspaceId: workspaceMembers.workspaceId, workspaceName: workspaces.name, role: workspaceMembers.role }).from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(eq(workspaceMembers.userId, user.id)).limit(1);
    await createSession({ userId: user.id, email: user.email });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, workspace: membership });
  } catch (error) { return apiError(error); }
}
