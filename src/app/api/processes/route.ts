import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiError } from "@/server/api";
import { requireWorkspaceAccess } from "@/server/access";
import { requireSession } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { processes, processVersions } from "@/server/db/schema";
import { processCreateSchema } from "@/server/validation";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const workspaceId = new URL(request.url).searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspace_required" }, { status: 400 });
    await requireWorkspaceAccess(session.userId, workspaceId);
    const items = await getDatabase().select({ id: processes.id, name: processes.name, status: processes.status, currentVersion: processes.currentVersion, createdAt: processes.createdAt, updatedAt: processes.updatedAt }).from(processes).where(eq(processes.workspaceId, workspaceId)).orderBy(desc(processes.updatedAt));
    return NextResponse.json({ processes: items });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = processCreateSchema.parse(await request.json());
    await requireWorkspaceAccess(session.userId, input.workspaceId, true);
    const result = await getDatabase().transaction(async (tx) => {
      const [process] = await tx.insert(processes).values(input).returning();
      await tx.insert(processVersions).values({ processId: process.id, version: 1, name: process.name, nodes: process.nodes, edges: process.edges, createdBy: session.userId });
      return process;
    });
    return NextResponse.json({ process: result }, { status: 201 });
  } catch (error) { return apiError(error); }
}
