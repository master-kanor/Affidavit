import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["owner", "admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["document", "image", "video", "audio", "physical", "digital"]).notNull(),
  category: varchar("category", { length: 100 }),
  fileUrl: varchar("file_url", { length: 1000 }),
  fileKey: varchar("file_key", { length: 500 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: int("file_size"),
  uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "verified", "disputed", "archived"]).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const autoDeploymentLog = mysqlTable("auto_deployment_log", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["PASS", "FAIL", "HEALED"]).notNull(),
  testsPassed: int("tests_passed").notNull().default(0),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["audit_failure", "new_evidence", "access_request"]).notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type AutoDeploymentLog = typeof autoDeploymentLog.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
