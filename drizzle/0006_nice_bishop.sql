CREATE TABLE `codebase_sprints` (
	`id` varchar(255) NOT NULL,
	`sprint_number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` varchar(255) DEFAULT 'planning',
	`start_date` timestamp,
	`end_date` timestamp,
	`goals` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `codebase_sprints_id` PRIMARY KEY(`id`),
	CONSTRAINT `codebase_sprints_sprint_number_unique` UNIQUE(`sprint_number`)
);
--> statement-breakpoint
CREATE TABLE `sprint_metrics` (
	`id` varchar(255) NOT NULL,
	`sprint_id` varchar(255) NOT NULL,
	`metric_name` varchar(255) NOT NULL,
	`metric_value` float NOT NULL,
	`metric_unit` varchar(255),
	`recorded_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sprint_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_tasks` (
	`id` varchar(255) NOT NULL,
	`sprint_id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`assignee_id` varchar(255),
	`status` varchar(255) DEFAULT 'todo',
	`priority` varchar(255) DEFAULT 'medium',
	`estimated_hours` int,
	`actual_hours` int,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sprint_tasks_id` PRIMARY KEY(`id`)
);

