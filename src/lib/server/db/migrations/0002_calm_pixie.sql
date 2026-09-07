ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `banned` integer DEFAULT false NOT NULL;