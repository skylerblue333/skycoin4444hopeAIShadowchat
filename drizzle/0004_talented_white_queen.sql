ALTER TABLE `direct_messages` ADD `isEncrypted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `encryptedContent` text;--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `encryptionKeyHint` varchar(64);--> statement-breakpoint
ALTER TABLE `direct_messages` ADD `burnAfterRead` boolean DEFAULT false NOT NULL;