import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalDatabase = globalThis as unknown as { processCanvasSql?: ReturnType<typeof postgres> };

export function getDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const sql = globalDatabase.processCanvasSql ?? postgres(url, { max: process.env.NODE_ENV === "production" ? 10 : 1 });
  if (process.env.NODE_ENV !== "production") globalDatabase.processCanvasSql = sql;
  return drizzle(sql, { schema });
}
