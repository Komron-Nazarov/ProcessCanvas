import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireProcessAccess } from "@/server/access";
import { apiError } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { processes, processVersions } from "@/server/db/schema";
import { processUpdateSchema } from "@/server/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try { const session = await requireSession(); const { id } = await params; return NextResponse.json({ process: await requireProcessAccess(session.userId, id) }); }
  catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const current = await requireProcessAccess(session.userId, id, true);
    const input = processUpdateSchema.parse(await request.json());
    if (input.expectedVersion && input.expectedVersion !== current.currentVersion) return NextResponse.json({ error: "version_conflict", process: current }, { status: 409 });
    const nextVersion = current.currentVersion + 1;
    const updated = await getDatabase().transaction(async (tx) => {
      const [process] = await tx.update(processes).set({ name: input.name, nodes: input.nodes, edges: input.edges, currentVersion: nextVersion, updatedAt: new Date() }).where(and(eq(processes.id, id), eq(processes.currentVersion, current.currentVersion))).returning();
      if (!process) throw new Error("VERSION_CONFLICT");
      await tx.insert(processVersions).values({ processId: id, version: nextVersion, name: process.name, nodes: process.nodes, edges: process.edges, createdBy: session.userId });
      return process;
    });
    return NextResponse.json({ process: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") return NextResponse.json({ error: "version_conflict" }, { status: 409 });
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try { const session = await requireSession(); const { id } = await params; await requireProcessAccess(session.userId, id, true); await getDatabase().delete(processes).where(eq(processes.id, id)); return NextResponse.json({ ok: true }); }
  catch (error) { return apiError(error); }
}
