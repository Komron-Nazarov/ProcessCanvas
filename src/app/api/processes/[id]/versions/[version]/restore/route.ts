import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireProcessAccess } from "@/server/access";
import { apiError } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { processes, processVersions } from "@/server/db/schema";

type Context = { params: Promise<{ id: string; version: string }> };
export async function POST(_: Request, { params }: Context) {
  try {
    const session = await requireSession(); const { id, version } = await params; const current = await requireProcessAccess(session.userId, id, true);
    const versionNumber = Number(version); if (!Number.isInteger(versionNumber)) return NextResponse.json({ error: "invalid_version" }, { status: 400 });
    const db = getDatabase(); const [snapshot] = await db.select().from(processVersions).where(and(eq(processVersions.processId, id), eq(processVersions.version, versionNumber))).limit(1); if (!snapshot) throw new Error("NOT_FOUND");
    const nextVersion = current.currentVersion + 1;
    const restored = await db.transaction(async (tx) => { const [process] = await tx.update(processes).set({ name: snapshot.name, nodes: snapshot.nodes, edges: snapshot.edges, currentVersion: nextVersion, updatedAt: new Date() }).where(eq(processes.id, id)).returning(); await tx.insert(processVersions).values({ processId: id, version: nextVersion, name: process.name, nodes: process.nodes, edges: process.edges, createdBy: session.userId }); return process; });
    return NextResponse.json({ process: restored });
  } catch (error) { return apiError(error); }
}
