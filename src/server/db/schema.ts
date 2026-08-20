import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export const workspaceRole = pgEnum("workspace_role", ["owner", "editor", "viewer"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: workspaceRole("role").default("viewer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.workspaceId, table.userId] }), index("workspace_members_user_idx").on(table.userId)]);

export const processes = pgTable("processes", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default("draft").notNull(),
  nodes: jsonb("nodes").$type<WorkflowNode[]>().default([]).notNull(),
  edges: jsonb("edges").$type<WorkflowEdge[]>().default([]).notNull(),
  currentVersion: integer("current_version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("processes_workspace_idx").on(table.workspaceId)]);

export const processVersions = pgTable("process_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  processId: uuid("process_id").notNull().references(() => processes.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").$type<WorkflowNode[]>().notNull(),
  edges: jsonb("edges").$type<WorkflowEdge[]>().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("process_versions_number_unique").on(table.processId, table.version), index("process_versions_process_idx").on(table.processId)]);

export const usersRelations = relations(users, ({ many }) => ({ memberships: many(workspaceMembers) }));
export const workspacesRelations = relations(workspaces, ({ many, one }) => ({ owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }), members: many(workspaceMembers), processes: many(processes) }));
export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({ workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }), user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }) }));
export const processesRelations = relations(processes, ({ one, many }) => ({ workspace: one(workspaces, { fields: [processes.workspaceId], references: [workspaces.id] }), versions: many(processVersions) }));
export const processVersionsRelations = relations(processVersions, ({ one }) => ({ process: one(processes, { fields: [processVersions.processId], references: [processes.id] }), author: one(users, { fields: [processVersions.createdBy], references: [users.id] }) }));
