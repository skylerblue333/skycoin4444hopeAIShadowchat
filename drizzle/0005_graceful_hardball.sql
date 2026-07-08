CREATE TABLE `action_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` varchar(50) NOT NULL,
	`basePriceUsd` decimal(10,4) NOT NULL,
	`platformFeePercent` decimal(5,2) DEFAULT '10',
	`creatorSharePercent` decimal(5,2) DEFAULT '70',
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `action_pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `action_pricing_actionType_unique` UNIQUE(`actionType`)
);
--> statement-breakpoint
CREATE TABLE `ai_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(100),
	`eventType` varchar(50) NOT NULL,
	`model` varchar(100),
	`inputTokens` int DEFAULT 0,
	`outputTokens` int DEFAULT 0,
	`latencyMs` int,
	`costUsd` decimal(10,6) DEFAULT '0',
	`inputText` text,
	`outputText` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`memoryType` varchar(50) NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` json NOT NULL,
	`confidence` decimal(4,3) DEFAULT '1',
	`source` varchar(50),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `os_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(50) NOT NULL,
	`intentText` text NOT NULL,
	`parsedPayload` json,
	`status` enum('pending','executing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`confidence` decimal(4,3) DEFAULT '0',
	`resultData` json,
	`errorMessage` text,
	`executionMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `os_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulation_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`archetype` varchar(50) NOT NULL,
	`personalityTraits` json,
	`interests` json,
	`trustScore` int NOT NULL DEFAULT 70,
	`followersCount` int NOT NULL DEFAULT 0,
	`activityLevel` enum('low','medium','high','viral') NOT NULL DEFAULT 'medium',
	`lastTickAt` timestamp,
	`memorySnapshot` json,
	`relationshipGraph` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulation_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `simulation_entities_personaId_unique` UNIQUE(`personaId`)
);
--> statement-breakpoint
CREATE TABLE `trust_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`overallScore` int NOT NULL DEFAULT 70,
	`paymentScore` int NOT NULL DEFAULT 70,
	`contentScore` int NOT NULL DEFAULT 70,
	`reportScore` int NOT NULL DEFAULT 100,
	`transactionScore` int NOT NULL DEFAULT 70,
	`aiScore` int NOT NULL DEFAULT 70,
	`tier` enum('new','trusted','verified','elite') NOT NULL DEFAULT 'new',
	`flags` json,
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trust_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `trust_scores_userId_unique` UNIQUE(`userId`)
);
