import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  int,
  bigint,
  timestamp,
  boolean,
  json,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Users & Authentication
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    role: mysqlEnum("role", [
      "super_admin",
      "ai_agent",
      "organizer",
      "admin",
      "professional",
      "user",
    ])
      .notNull()
      .default("user"),
    avatar: varchar("avatar", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
  })
);

// Evidence & Gallery
export const evidence = mysqlTable(
  "evidence",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", [
      "document",
      "image",
      "video",
      "audio",
      "physical",
      "digital",
    ]).notNull(),
    category: varchar("category", { length: 100 }),
    fileUrl: varchar("file_url", { length: 1000 }),
    fileKey: varchar("file_key", { length: 500 }),
    mimeType: varchar("mime_type", { length: 100 }),
    fileSize: bigint("file_size", { mode: "number" }),
    uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["pending", "verified", "disputed", "archived"])
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uploadedByIdx: index("uploaded_by_idx").on(table.uploadedBy),
    typeIdx: index("type_idx").on(table.type),
    statusIdx: index("status_idx").on(table.status),
  })
);

// Annotations (Phase 5)
export const annotations = mysqlTable(
  "annotations",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    evidenceId: varchar("evidence_id", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["highlight", "note", "flag", "question", "reference"])
      .notNull()
      .default("highlight"),
    content: text("content"),
    color: varchar("color", { length: 50 }).default("#fbbf24"),
    startOffset: int("start_offset"),
    endOffset: int("end_offset"),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    evidenceIdIdx: index("evidence_id_idx").on(table.evidenceId),
    createdByIdx: index("created_by_idx").on(table.createdBy),
  })
);

// Documentation (Phase 5)
export const documentation = mysqlTable(
  "documentation",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    type: mysqlEnum("type", [
      "summary",
      "report",
      "analysis",
      "timeline",
      "narrative",
    ])
      .notNull()
      .default("summary"),
    status: mysqlEnum("status", ["draft", "review", "approved", "archived"])
      .notNull()
      .default("draft"),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    createdByIdx: index("created_by_idx").on(table.createdBy),
    statusIdx: index("status_idx").on(table.status),
  })
);

// Tags (Phase 5)
export const tags = mysqlTable(
  "tags",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    color: varchar("color", { length: 50 }).default("#3b82f6"),
    usageCount: int("usage_count").default(0),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("name_idx").on(table.name),
    categoryIdx: index("category_idx").on(table.category),
  })
);

// Evidence Tags
export const evidenceTags = mysqlTable(
  "evidence_tags",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    evidenceId: varchar("evidence_id", { length: 255 }).notNull(),
    tagId: varchar("tag_id", { length: 255 }).notNull(),
    addedBy: varchar("added_by", { length: 255 }).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => ({
    evidenceIdIdx: index("evidence_id_idx").on(table.evidenceId),
    tagIdIdx: index("tag_id_idx").on(table.tagId),
  })
);

// Collections (Phase 5)
export const collections = mysqlTable(
  "collections",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    isPublic: boolean("is_public").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    createdByIdx: index("created_by_idx").on(table.createdBy),
  })
);

// Collection Items
export const collectionItems = mysqlTable(
  "collection_items",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    collectionId: varchar("collection_id", { length: 255 }).notNull(),
    evidenceId: varchar("evidence_id", { length: 255 }).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => ({
    collectionIdIdx: index("collection_id_idx").on(table.collectionId),
    evidenceIdIdx: index("evidence_id_idx").on(table.evidenceId),
  })
);

// Knowledge Base Articles (Phase 5)
export const knowledgeBaseArticles = mysqlTable(
  "knowledge_base_articles",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    category: mysqlEnum("category", [
      "evidence",
      "procedure",
      "reference",
      "template",
      "best_practice",
    ])
      .notNull()
      .default("procedure"),
    tags: json("tags").$type<string[]>(),
    isPublished: boolean("is_published").default(false),
    viewCount: int("view_count").default(0),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    createdByIdx: index("created_by_idx").on(table.createdBy),
    categoryIdx: index("category_idx").on(table.category),
  })
);

// Reports (Phase 5)
export const reports = mysqlTable(
  "reports",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    type: mysqlEnum("type", [
      "summary",
      "detailed",
      "timeline",
      "statistics",
      "audit",
    ])
      .notNull()
      .default("summary"),
    format: mysqlEnum("format", ["pdf", "html", "json", "csv", "markdown"])
      .notNull()
      .default("pdf"),
    status: mysqlEnum("status", ["generating", "completed", "failed"])
      .notNull()
      .default("generating"),
    progress: int("progress").default(0),
    fileUrl: varchar("file_url", { length: 1000 }),
    generatedBy: varchar("generated_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    generatedByIdx: index("generated_by_idx").on(table.generatedBy),
    statusIdx: index("status_idx").on(table.status),
  })
);

// Exports (Phase 5)
export const exports = mysqlTable(
  "exports",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    format: mysqlEnum("format", ["pdf", "html", "json", "csv", "markdown", "zip"])
      .notNull()
      .default("zip"),
    status: mysqlEnum("status", ["processing", "completed", "failed"])
      .notNull()
      .default("processing"),
    progress: int("progress").default(0),
    fileUrl: varchar("file_url", { length: 1000 }),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    createdByIdx: index("created_by_idx").on(table.createdBy),
    statusIdx: index("status_idx").on(table.status),
  })
);

// Audit Logs
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }),
    details: json("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    actionIdx: index("action_idx").on(table.action),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  evidence: many(evidence),
  annotations: many(annotations),
  documentation: many(documentation),
  tags: many(tags),
  collections: many(collections),
  articles: many(knowledgeBaseArticles),
  reports: many(reports),
  auditLogs: many(auditLogs),
}));

export const evidenceRelations = relations(evidence, ({ many, one }) => ({
  annotations: many(annotations),
  tags: many(evidenceTags),
  collectionItems: many(collectionItems),
  uploadedByUser: one(users, {
    fields: [evidence.uploadedBy],
    references: [users.id],
  }),
}));

export const annotationsRelations = relations(annotations, ({ one }) => ({
  evidence: one(evidence, {
    fields: [annotations.evidenceId],
    references: [evidence.id],
  }),
  createdByUser: one(users, {
    fields: [annotations.createdBy],
    references: [users.id],
  }),
}));

export const documentationRelations = relations(documentation, ({ one }) => ({
  createdByUser: one(users, {
    fields: [documentation.createdBy],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many, one }) => ({
  evidence: many(evidenceTags),
  createdByUser: one(users, {
    fields: [tags.createdBy],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ many, one }) => ({
  items: many(collectionItems),
  createdByUser: one(users, {
    fields: [collections.createdBy],
    references: [users.id],
  }),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id],
  }),
  evidence: one(evidence, {
    fields: [collectionItems.evidenceId],
    references: [evidence.id],
  }),
}));

export const knowledgeBaseArticlesRelations = relations(
  knowledgeBaseArticles,
  ({ one }) => ({
    createdByUser: one(users, {
      fields: [knowledgeBaseArticles.createdBy],
      references: [users.id],
    }),
  })
);

export const reportsRelations = relations(reports, ({ one }) => ({
  generatedByUser: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
  }),
}));

export const exportsRelations = relations(exports, ({ one }) => ({
  createdByUser: one(users, {
    fields: [exports.createdBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
export type Documentation = typeof documentation.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type KnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Export = typeof exports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
