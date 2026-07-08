CREATE TABLE `codebase_sprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sprintNumber` int NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`status` enum('scheduled','running','completed','failed') NOT NULL DEFAULT 'scheduled',
	`totalLinesAdded` int NOT NULL DEFAULT 0,
	`totalFilesModified` int NOT NULL DEFAULT 0,
	`languagesUsed` json,
	`botsActivated` json,
	`featuresBuilt` json,
	`testsAdded` int NOT NULL DEFAULT 0,
	`securityIssuesFixed` int NOT NULL DEFAULT 0,
	`performanceGainPct` decimal(5,2) DEFAULT '0',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`cronExpression` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codebase_sprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`totalLines` int NOT NULL DEFAULT 0,
	`tsLines` int NOT NULL DEFAULT 0,
	`solidityLines` int NOT NULL DEFAULT 0,
	`rustLines` int NOT NULL DEFAULT 0,
	`pythonLines` int NOT NULL DEFAULT 0,
	`sqlLines` int NOT NULL DEFAULT 0,
	`shellLines` int NOT NULL DEFAULT 0,
	`testCoverage` decimal(5,2) DEFAULT '0',
	`sprintsCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sprint_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sprintId` int NOT NULL,
	`botId` varchar(20) NOT NULL,
	`taskType` varchar(50) NOT NULL,
	`language` varchar(20) NOT NULL,
	`description` text NOT NULL,
	`linesGenerated` int NOT NULL DEFAULT 0,
	`status` enum('pending','running','done','failed') NOT NULL DEFAULT 'pending',
	`output` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sprint_tasks_id` PRIMARY KEY(`id`)
);
