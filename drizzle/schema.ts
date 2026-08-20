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


// Canonical case knowledge model (source-preserving and approval-gated)
export const caseRecords = mysqlTable(
  "case_records",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["draft", "active", "archived"]).notNull().default("active"),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({ statusIdx: index("case_status_idx").on(table.status) })
);

export const affidavitSections = mysqlTable(
  "affidavit_sections",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    sectionNumber: varchar("section_number", { length: 50 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    sortOrder: int("sort_order").notNull(),
    sourceLabel: varchar("source_label", { length: 500 }),
    approvalStatus: mysqlEnum("approval_status", ["source", "approved", "proposed", "needs_review"]).notNull().default("source"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({ caseIdx: index("affidavit_section_case_idx").on(table.caseId), orderIdx: index("affidavit_section_order_idx").on(table.sortOrder) })
);

export const affidavitTextVersions = mysqlTable(
  "affidavit_text_versions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    sectionId: varchar("section_id", { length: 255 }).notNull(),
    versionKind: mysqlEnum("version_kind", ["source_original", "current_approved", "ai_proposed"]).notNull(),
    textContent: text("text_content").notNull(),
    sourceReference: varchar("source_reference", { length: 1000 }),
    recommendationId: varchar("recommendation_id", { length: 255 }),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ sectionIdx: index("affidavit_text_section_idx").on(table.sectionId), kindIdx: index("affidavit_text_kind_idx").on(table.versionKind) })
);

export const evidenceAssets = mysqlTable(
  "evidence_assets",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    assetType: mysqlEnum("asset_type", ["image", "video", "document", "audio", "external_link"]).notNull(),
    previewUrl: varchar("preview_url", { length: 1000 }),
    sourceUrl: varchar("source_url", { length: 1000 }),
    originalObjectKey: varchar("original_object_key", { length: 500 }),
    checksumSha256: varchar("checksum_sha256", { length: 128 }),
    verificationState: mysqlEnum("verification_state", ["unverified", "owner_verified", "admin_verified", "disputed", "archived"]).notNull().default("unverified"),
    provenanceKind: mysqlEnum("provenance_kind", ["source_fact", "owner_content", "ai_inference", "ai_suggestion", "unverified"]).notNull().default("unverified"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({ caseIdx: index("evidence_asset_case_idx").on(table.caseId), typeIdx: index("evidence_asset_type_idx").on(table.assetType), verificationIdx: index("evidence_asset_verification_idx").on(table.verificationState) })
);

export const testimonies = mysqlTable(
  "testimonies",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    provenanceKind: mysqlEnum("provenance_kind", ["source_fact", "owner_content", "ai_inference", "ai_suggestion", "unverified"]).notNull().default("unverified"),
    verificationState: mysqlEnum("verification_state", ["unverified", "owner_verified", "admin_verified", "disputed", "archived"]).notNull().default("unverified"),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({ caseIdx: index("testimony_case_idx").on(table.caseId) })
);

export const timelineEvents = mysqlTable(
  "timeline_events",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    eventDate: timestamp("event_date"),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    verificationState: mysqlEnum("verification_state", ["unverified", "owner_verified", "admin_verified", "disputed", "archived"]).notNull().default("unverified"),
    sourceReference: varchar("source_reference", { length: 1000 }),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ caseIdx: index("timeline_case_idx").on(table.caseId), dateIdx: index("timeline_date_idx").on(table.eventDate) })
);

export const caseRelationships = mysqlTable(
  "case_relationships",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    sourceType: varchar("source_type", { length: 100 }).notNull(),
    sourceId: varchar("source_id", { length: 255 }).notNull(),
    targetType: varchar("target_type", { length: 100 }).notNull(),
    targetId: varchar("target_id", { length: 255 }).notNull(),
    relationshipType: mysqlEnum("relationship_type", ["supports", "references", "related_to", "corroborates", "contradicts", "derived_from", "source_of", "appears_in", "mentioned_in", "timeline_related", "documented_by"]).notNull(),
    confidence: int("confidence"),
    approvalStatus: mysqlEnum("approval_status", ["suggested", "accepted", "modified", "rejected"]).notNull().default("suggested"),
    notes: text("notes"),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    verifiedBy: varchar("verified_by", { length: 255 }),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ caseIdx: index("relationship_case_idx").on(table.caseId), sourceIdx: index("relationship_source_idx").on(table.sourceType, table.sourceId), targetIdx: index("relationship_target_idx").on(table.targetType, table.targetId) })
);

export const aiRecommendations = mysqlTable(
  "ai_recommendations",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    agentId: varchar("agent_id", { length: 255 }).notNull(),
    recommendationType: varchar("recommendation_type", { length: 100 }).notNull(),
    priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).notNull().default("medium"),
    targetResourceType: varchar("target_resource_type", { length: 100 }).notNull(),
    targetResourceId: varchar("target_resource_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    explanation: text("explanation").notNull(),
    suggestedChange: text("suggested_change"),
    supportingSources: json("supporting_sources").$type<string[]>(),
    confidence: int("confidence"),
    status: mysqlEnum("status", ["pending", "accepted", "rejected", "modified", "applied"]).notNull().default("pending"),
    reviewedBy: varchar("reviewed_by", { length: 255 }),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ caseIdx: index("recommendation_case_idx").on(table.caseId), statusIdx: index("recommendation_status_idx").on(table.status) })
);

export const documentaries = mysqlTable(
  "documentaries",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["draft", "review", "approved", "archived"]).notNull().default("draft"),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({ caseIdx: index("documentary_case_idx").on(table.caseId) })
);

export const documentaryChapters = mysqlTable(
  "documentary_chapters",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    documentaryId: varchar("documentary_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    narration: text("narration"),
    sortOrder: int("sort_order").notNull(),
    status: mysqlEnum("status", ["draft", "review", "approved"]).notNull().default("draft"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ documentaryIdx: index("chapter_documentary_idx").on(table.documentaryId), orderIdx: index("chapter_order_idx").on(table.sortOrder) })
);

export const documentaryItems = mysqlTable(
  "documentary_items",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    chapterId: varchar("chapter_id", { length: 255 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }).notNull(),
    caption: text("caption"),
    notes: text("notes"),
    sortOrder: int("sort_order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ chapterIdx: index("documentary_item_chapter_idx").on(table.chapterId), orderIdx: index("documentary_item_order_idx").on(table.sortOrder) })
);

export const resourcePermissions = mysqlTable(
  "resource_permissions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    caseId: varchar("case_id", { length: 255 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }).notNull(),
    principalType: mysqlEnum("principal_type", ["owner", "admin", "guest"]).notNull(),
    principalId: varchar("principal_id", { length: 255 }),
    canView: boolean("can_view").notNull().default(false),
    canEdit: boolean("can_edit").notNull().default(false),
    canExport: boolean("can_export").notNull().default(false),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ resourceIdx: index("permission_resource_idx").on(table.resourceType, table.resourceId), principalIdx: index("permission_principal_idx").on(table.principalType, table.principalId) })
);

export type CaseRecord = typeof caseRecords.$inferSelect;
export type AffidavitSection = typeof affidavitSections.$inferSelect;
export type AffidavitTextVersion = typeof affidavitTextVersions.$inferSelect;
export type EvidenceAsset = typeof evidenceAssets.$inferSelect;
export type Testimony = typeof testimonies.$inferSelect;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type CaseRelationship = typeof caseRelationships.$inferSelect;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type Documentary = typeof documentaries.$inferSelect;
export type DocumentaryChapter = typeof documentaryChapters.$inferSelect;
export type DocumentaryItem = typeof documentaryItems.$inferSelect;
export type ResourcePermission = typeof resourcePermissions.$inferSelect;
