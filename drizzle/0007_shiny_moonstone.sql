CREATE TABLE `mfa_recovery_codes` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`used` boolean DEFAULT false,
	`used_at` timestamp,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mfa_recovery_codes_id` PRIMARY KEY(`id`)
);
