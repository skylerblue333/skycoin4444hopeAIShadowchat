-- HOPE AI Intelligence Layer (Phase 2) — TiDB-valid DDL (no defaults on JSON/TEXT)
CREATE TABLE IF NOT EXISTS `twin_memory` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `summary` text,
  `goals` json,
  `projects` json,
  `preferences` json,
  `finances` json,
  `learning` json,
  `lastInteractionAt` timestamp NOT NULL DEFAULT (now()),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `twin_memory_userId_unique` (`userId`)
);

CREATE TABLE IF NOT EXISTS `twin_facts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `kind` enum('goal','project','preference','finance','learning','fact','event') NOT NULL DEFAULT 'fact',
  `content` text NOT NULL,
  `source` varchar(64) NOT NULL DEFAULT 'chat',
  `confidence` int NOT NULL DEFAULT 80,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `twin_facts_userId_idx` (`userId`)
);

CREATE TABLE IF NOT EXISTS `reputation_scores` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `learningScore` int NOT NULL DEFAULT 0,
  `builderScore` int NOT NULL DEFAULT 0,
  `teachingScore` int NOT NULL DEFAULT 0,
  `communityScore` int NOT NULL DEFAULT 0,
  `trustScore` int NOT NULL DEFAULT 50,
  `overall` int NOT NULL DEFAULT 0,
  `breakdown` json,
  `computedAt` timestamp NOT NULL DEFAULT (now()),
  UNIQUE KEY `reputation_scores_userId_unique` (`userId`)
);

CREATE TABLE IF NOT EXISTS `opportunities` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `postedBy` int,
  `type` enum('job','project','investor','cofounder','mentor','study_partner','language_partner','gig') NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `skills` json,
  `tags` json,
  `location` varchar(120),
  `remote` boolean NOT NULL DEFAULT true,
  `compensation` varchar(120),
  `status` enum('open','closed','filled') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `opportunities_type_idx` (`type`),
  KEY `opportunities_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `opportunity_matches` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `opportunityId` int NOT NULL,
  `score` int NOT NULL DEFAULT 0,
  `reasoning` text,
  `status` enum('suggested','saved','applied','dismissed') NOT NULL DEFAULT 'suggested',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `opportunity_matches_userId_idx` (`userId`)
);

CREATE TABLE IF NOT EXISTS `missions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `category` enum('skill','language','startup','career','fitness','custom') NOT NULL DEFAULT 'skill',
  `description` text,
  `status` enum('active','completed','paused','abandoned') NOT NULL DEFAULT 'active',
  `progress` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  KEY `missions_userId_idx` (`userId`)
);

CREATE TABLE IF NOT EXISTS `mission_steps` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `missionId` int NOT NULL,
  `ordinal` int NOT NULL DEFAULT 0,
  `title` varchar(200) NOT NULL,
  `detail` text,
  `done` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `mission_steps_missionId_idx` (`missionId`)
);

CREATE TABLE IF NOT EXISTS `startup_blueprints` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `idea` text NOT NULL,
  `name` varchar(160),
  `tagline` varchar(240),
  `businessPlan` json,
  `branding` json,
  `marketing` json,
  `mvpRoadmap` json,
  `teamPlan` json,
  `status` enum('draft','generated','launched') NOT NULL DEFAULT 'generated',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `startup_blueprints_userId_idx` (`userId`)
);

CREATE TABLE IF NOT EXISTS `ai_market_listings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sellerId` int NOT NULL,
  `kind` enum('agent','prompt','workflow','template','automation') NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `content` text,
  `priceCents` int NOT NULL DEFAULT 0,
  `tags` json,
  `sales` int NOT NULL DEFAULT 0,
  `ratingSum` int NOT NULL DEFAULT 0,
  `ratingCount` int NOT NULL DEFAULT 0,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `ai_market_listings_kind_idx` (`kind`)
);

CREATE TABLE IF NOT EXISTS `ai_market_purchases` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `listingId` int NOT NULL,
  `buyerId` int NOT NULL,
  `pricePaidCents` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  KEY `ai_market_purchases_buyerId_idx` (`buyerId`)
);
