import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiError } from "@/server/api";
import { createSession } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { users, workspaceMembers, workspaces } from "@/server/db/schema";
import { registerSchema } from "@/server/validation";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const db = getDatabase();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length) return NextResponse.json({ error: "email_exists" }, { status: 409 });
    const passwordHash = await hash(input.password, 12);
    const result = await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({ name: input.name, email: input.email, passwordHash }).returning({ id: users.id, name: users.name, email: users.email });
      const [workspace] = await tx.insert(workspaces).values({ name: `${input.name} — Workspace`, ownerId: user.id }).returning({ id: workspaces.id, name: workspaces.name });
      await tx.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: user.id, role: "owner" });
      return { user, workspace };
    });
    await createSession({ userId: result.user.id, email: result.user.email });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return apiError(error); }
}
