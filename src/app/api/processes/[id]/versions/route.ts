import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireProcessAccess } from "@/server/access";
import { apiError } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { processVersions } from "@/server/db/schema";

type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  try { const session = await requireSession(); const { id } = await params; await requireProcessAccess(session.userId, id); const versions = await getDatabase().select().from(processVersions).where(eq(processVersions.processId, id)).orderBy(desc(processVersions.version)); return NextResponse.json({ versions }); }
  catch (error) { return apiError(error); }
}
