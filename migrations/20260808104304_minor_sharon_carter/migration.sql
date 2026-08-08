CREATE TABLE `itinerary_revision` (
	`id` text PRIMARY KEY,
	`trip_id` text NOT NULL,
	`revision_number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`confirmed_at` integer,
	CONSTRAINT `fk_itinerary_revision_trip_id_trip_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON DELETE CASCADE,
	CONSTRAINT "itinerary_revision_number_check" CHECK("revision_number" > 0),
	CONSTRAINT "itinerary_revision_status_check" CHECK("status" in ('draft', 'confirmed', 'superseded', 'discarded')),
	CONSTRAINT "itinerary_revision_content_json_check" CHECK(json_valid("content"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_revision_trip_revision_unique` ON `itinerary_revision` (`trip_id`,`revision_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_revision_current_draft_unique` ON `itinerary_revision` (`trip_id`) WHERE "itinerary_revision"."status" = 'draft';--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_revision_current_confirmed_unique` ON `itinerary_revision` (`trip_id`) WHERE "itinerary_revision"."status" = 'confirmed';--> statement-breakpoint
CREATE INDEX `itinerary_revision_trip_status_revision_idx` ON `itinerary_revision` (`trip_id`,`status`,`revision_number`);