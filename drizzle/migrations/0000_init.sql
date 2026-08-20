-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(255) PRIMARY KEY,
  `email` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255),
  `role` enum('super_admin','ai_agent','organizer','admin','professional','user') NOT NULL DEFAULT 'user',
  `avatar` varchar(500),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `email_idx` (`email`),
  INDEX `role_idx` (`role`)
);

-- Evidence table
CREATE TABLE IF NOT EXISTS `evidence` (
  `id` varchar(255) PRIMARY KEY,
  `title` varchar(500) NOT NULL,
  `description` text,
  `type` enum('document','image','video','audio','physical','digital') NOT NULL,
  `category` varchar(100),
  `file_url` varchar(1000),
  `file_key` varchar(500),
  `mime_type` varchar(100),
  `file_size` bigint,
  `uploaded_by` varchar(255) NOT NULL,
  `status` enum('pending','verified','disputed','archived') NOT NULL DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `uploaded_by_idx` (`uploaded_by`),
  INDEX `type_idx` (`type`),
  INDEX `status_idx` (`status`),
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
);

-- Annotations table (Phase 5)
CREATE TABLE IF NOT EXISTS `annotations` (
  `id` varchar(255) PRIMARY KEY,
  `evidence_id` varchar(255) NOT NULL,
  `type` enum('highlight','note','flag','question','reference') NOT NULL DEFAULT 'highlight',
  `content` text,
  `color` varchar(50) DEFAULT '#fbbf24',
  `start_offset` int,
  `end_offset` int,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `evidence_id_idx` (`evidence_id`),
  INDEX `created_by_idx` (`created_by`),
  FOREIGN KEY (`evidence_id`) REFERENCES `evidence`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Documentation table (Phase 5)
CREATE TABLE IF NOT EXISTS `documentation` (
  `id` varchar(255) PRIMARY KEY,
  `title` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `type` enum('summary','report','analysis','timeline','narrative') NOT NULL DEFAULT 'summary',
  `status` enum('draft','review','approved','archived') NOT NULL DEFAULT 'draft',
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `created_by_idx` (`created_by`),
  INDEX `status_idx` (`status`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Tags table (Phase 5)
CREATE TABLE IF NOT EXISTS `tags` (
  `id` varchar(255) PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT '#3b82f6',
  `usage_count` int DEFAULT 0,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `name_idx` (`name`),
  INDEX `category_idx` (`category`),
  INDEX `created_by_idx` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Evidence Tags junction table
CREATE TABLE IF NOT EXISTS `evidence_tags` (
  `id` varchar(255) PRIMARY KEY,
  `evidence_id` varchar(255) NOT NULL,
  `tag_id` varchar(255) NOT NULL,
  `added_by` varchar(255) NOT NULL,
  `added_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `evidence_id_idx` (`evidence_id`),
  INDEX `tag_id_idx` (`tag_id`),
  UNIQUE KEY `unique_evidence_tag` (`evidence_id`, `tag_id`),
  FOREIGN KEY (`evidence_id`) REFERENCES `evidence`(`id`),
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`),
  FOREIGN KEY (`added_by`) REFERENCES `users`(`id`)
);

-- Collections table (Phase 5)
CREATE TABLE IF NOT EXISTS `collections` (
  `id` varchar(255) PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_by` varchar(255) NOT NULL,
  `is_public` boolean DEFAULT false,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `created_by_idx` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Collection Items
CREATE TABLE IF NOT EXISTS `collection_items` (
  `id` varchar(255) PRIMARY KEY,
  `collection_id` varchar(255) NOT NULL,
  `evidence_id` varchar(255) NOT NULL,
  `added_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `collection_id_idx` (`collection_id`),
  INDEX `evidence_id_idx` (`evidence_id`),
  FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`),
  FOREIGN KEY (`evidence_id`) REFERENCES `evidence`(`id`)
);

-- Knowledge Base Articles (Phase 5)
CREATE TABLE IF NOT EXISTS `knowledge_base_articles` (
  `id` varchar(255) PRIMARY KEY,
  `title` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `category` enum('evidence','procedure','reference','template','best_practice') NOT NULL DEFAULT 'procedure',
  `tags` json,
  `is_published` boolean DEFAULT false,
  `view_count` int DEFAULT 0,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `created_by_idx` (`created_by`),
  INDEX `category_idx` (`category`),
  INDEX `is_published_idx` (`is_published`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Reports table (Phase 5)
CREATE TABLE IF NOT EXISTS `reports` (
  `id` varchar(255) PRIMARY KEY,
  `title` varchar(500) NOT NULL,
  `type` enum('summary','detailed','timeline','statistics','audit') NOT NULL DEFAULT 'summary',
  `format` enum('pdf','html','json','csv','markdown') NOT NULL DEFAULT 'pdf',
  `status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
  `progress` int DEFAULT 0,
  `file_url` varchar(1000),
  `generated_by` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL,
  INDEX `generated_by_idx` (`generated_by`),
  INDEX `status_idx` (`status`),
  FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`)
);

-- Exports table (Phase 5)
CREATE TABLE IF NOT EXISTS `exports` (
  `id` varchar(255) PRIMARY KEY,
  `format` enum('pdf','html','json','csv','markdown','zip') NOT NULL DEFAULT 'zip',
  `status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
  `progress` int DEFAULT 0,
  `file_url` varchar(1000),
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL,
  INDEX `created_by_idx` (`created_by`),
  INDEX `status_idx` (`status`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` varchar(255) PRIMARY KEY,
  `user_id` varchar(255) NOT NULL,
  `action` varchar(100) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `resource_id` varchar(255),
  `details` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `user_id_idx` (`user_id`),
  INDEX `action_idx` (`action`),
  INDEX `resource_idx` (`resource`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
