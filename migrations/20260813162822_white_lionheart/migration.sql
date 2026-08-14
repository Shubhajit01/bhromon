CREATE TABLE `itinerary_activity` (
	`id` text PRIMARY KEY,
	`revision_id` text NOT NULL,
	`visit_id` text NOT NULL,
	`source_ref` text NOT NULL,
	`position` integer NOT NULL,
	`category` text,
	`start_time` text,
	`end_time` text,
	`time_label` text,
	`title` text NOT NULL,
	`description` text,
	CONSTRAINT `itinerary_activity_visit_revision_fk` FOREIGN KEY (`visit_id`,`revision_id`) REFERENCES `place_visit`(`id`,`revision_id`) ON DELETE CASCADE,
	CONSTRAINT "itinerary_activity_position_check" CHECK("position" > 0),
	CONSTRAINT "itinerary_activity_time_presence_check" CHECK("start_time" is not null or "time_label" is not null),
	CONSTRAINT "itinerary_activity_end_time_check" CHECK("end_time" is null or "start_time" is not null)
);
--> statement-breakpoint
CREATE TABLE `itinerary_day` (
	`id` text PRIMARY KEY,
	`revision_id` text NOT NULL,
	`source_ref` text NOT NULL,
	`day_number` integer NOT NULL,
	`date` text,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	CONSTRAINT `fk_itinerary_day_revision_id_itinerary_revision_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `itinerary_revision`(`id`) ON DELETE CASCADE,
	CONSTRAINT "itinerary_day_number_check" CHECK("day_number" > 0)
);
--> statement-breakpoint
CREATE TABLE `itinerary_day_highlight` (
	`id` text PRIMARY KEY,
	`day_id` text NOT NULL,
	`position` integer NOT NULL,
	`text` text NOT NULL,
	CONSTRAINT `fk_itinerary_day_highlight_day_id_itinerary_day_id_fk` FOREIGN KEY (`day_id`) REFERENCES `itinerary_day`(`id`) ON DELETE CASCADE,
	CONSTRAINT "itinerary_day_highlight_position_check" CHECK("position" > 0)
);
--> statement-breakpoint
CREATE TABLE `itinerary_revision` (
	`id` text PRIMARY KEY,
	`trip_id` text NOT NULL,
	`revision_number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`destination_time_zone` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`confirmed_at` integer,
	CONSTRAINT `fk_itinerary_revision_trip_id_trip_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON DELETE CASCADE,
	CONSTRAINT "itinerary_revision_number_check" CHECK("revision_number" > 0),
	CONSTRAINT "itinerary_revision_status_check" CHECK("status" in ('draft', 'confirmed', 'superseded', 'discarded'))
);
--> statement-breakpoint
CREATE TABLE `itinerary_route_leg` (
	`id` text PRIMARY KEY,
	`transition_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`mode` text NOT NULL,
	`from_label` text,
	`to_label` text,
	`departure_time` text,
	`arrival_time` text,
	`distance_meters` integer,
	`duration_seconds` integer,
	`encoded_polyline` text,
	CONSTRAINT `fk_itinerary_route_leg_transition_id_itinerary_transition_id_fk` FOREIGN KEY (`transition_id`) REFERENCES `itinerary_transition`(`id`) ON DELETE CASCADE,
	CONSTRAINT "itinerary_route_leg_sequence_check" CHECK("sequence" > 0),
	CONSTRAINT "itinerary_route_leg_distance_check" CHECK("distance_meters" is null or "distance_meters" >= 0),
	CONSTRAINT "itinerary_route_leg_duration_check" CHECK("duration_seconds" is null or "duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE `itinerary_transition` (
	`id` text PRIMARY KEY,
	`revision_id` text NOT NULL,
	`origin_visit_id` text NOT NULL,
	`destination_visit_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`primary_mode` text,
	`distance_meters` integer,
	`duration_seconds` integer,
	`provider` text,
	`provider_route_id` text,
	`encoded_polyline` text,
	CONSTRAINT `fk_itinerary_transition_revision_id_itinerary_revision_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `itinerary_revision`(`id`) ON DELETE CASCADE,
	CONSTRAINT `itinerary_transition_origin_visit_revision_fk` FOREIGN KEY (`origin_visit_id`,`revision_id`) REFERENCES `place_visit`(`id`,`revision_id`) ON DELETE CASCADE,
	CONSTRAINT `itinerary_transition_destination_visit_revision_fk` FOREIGN KEY (`destination_visit_id`,`revision_id`) REFERENCES `place_visit`(`id`,`revision_id`) ON DELETE CASCADE,
	CONSTRAINT "itinerary_transition_sequence_check" CHECK("sequence" > 0),
	CONSTRAINT "itinerary_transition_status_check" CHECK("status" in ('pending', 'routed', 'failed', 'stale')),
	CONSTRAINT "itinerary_transition_distinct_visits_check" CHECK("origin_visit_id" <> "destination_visit_id"),
	CONSTRAINT "itinerary_transition_distance_check" CHECK("distance_meters" is null or "distance_meters" >= 0),
	CONSTRAINT "itinerary_transition_duration_check" CHECK("duration_seconds" is null or "duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE `place` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`address` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "place_latitude_check" CHECK("latitude" between -90 and 90),
	CONSTRAINT "place_longitude_check" CHECK("longitude" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE `place_external_id` (
	`id` text PRIMARY KEY,
	`place_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	CONSTRAINT `fk_place_external_id_place_id_place_id_fk` FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `place_visit` (
	`id` text PRIMARY KEY,
	`revision_id` text NOT NULL,
	`day_id` text NOT NULL,
	`place_id` text NOT NULL,
	`source_ref` text NOT NULL,
	`sequence` integer NOT NULL,
	CONSTRAINT `fk_place_visit_place_id_place_id_fk` FOREIGN KEY (`place_id`) REFERENCES `place`(`id`),
	CONSTRAINT `place_visit_day_revision_fk` FOREIGN KEY (`day_id`,`revision_id`) REFERENCES `itinerary_day`(`id`,`revision_id`) ON DELETE CASCADE,
	CONSTRAINT "place_visit_sequence_check" CHECK("sequence" > 0)
);
--> statement-breakpoint
CREATE TABLE `trip` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_trip_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT "trip_status_check" CHECK("status" in ('draft', 'confirmed'))
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`is_anonymous` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_activity_visit_position_unique` ON `itinerary_activity` (`visit_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_activity_visit_source_ref_unique` ON `itinerary_activity` (`visit_id`,`source_ref`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_activity_revision_source_ref_unique` ON `itinerary_activity` (`revision_id`,`source_ref`);--> statement-breakpoint
CREATE INDEX `itinerary_activity_visit_idx` ON `itinerary_activity` (`visit_id`);--> statement-breakpoint
CREATE INDEX `itinerary_activity_revision_idx` ON `itinerary_activity` (`revision_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_day_revision_number_unique` ON `itinerary_day` (`revision_id`,`day_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_day_revision_source_ref_unique` ON `itinerary_day` (`revision_id`,`source_ref`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_day_id_revision_unique` ON `itinerary_day` (`id`,`revision_id`);--> statement-breakpoint
CREATE INDEX `itinerary_day_revision_idx` ON `itinerary_day` (`revision_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_day_highlight_position_unique` ON `itinerary_day_highlight` (`day_id`,`position`);--> statement-breakpoint
CREATE INDEX `itinerary_day_highlight_day_idx` ON `itinerary_day_highlight` (`day_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_revision_trip_revision_unique` ON `itinerary_revision` (`trip_id`,`revision_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_revision_current_draft_unique` ON `itinerary_revision` (`trip_id`) WHERE "itinerary_revision"."status" = 'draft';--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_revision_current_confirmed_unique` ON `itinerary_revision` (`trip_id`) WHERE "itinerary_revision"."status" = 'confirmed';--> statement-breakpoint
CREATE INDEX `itinerary_revision_trip_status_revision_idx` ON `itinerary_revision` (`trip_id`,`status`,`revision_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_route_leg_transition_sequence_unique` ON `itinerary_route_leg` (`transition_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `itinerary_route_leg_transition_idx` ON `itinerary_route_leg` (`transition_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_transition_revision_sequence_unique` ON `itinerary_transition` (`revision_id`,`sequence`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_transition_visit_pair_unique` ON `itinerary_transition` (`revision_id`,`origin_visit_id`,`destination_visit_id`);--> statement-breakpoint
CREATE INDEX `itinerary_transition_revision_idx` ON `itinerary_transition` (`revision_id`);--> statement-breakpoint
CREATE INDEX `itinerary_transition_origin_visit_idx` ON `itinerary_transition` (`origin_visit_id`);--> statement-breakpoint
CREATE INDEX `itinerary_transition_destination_visit_idx` ON `itinerary_transition` (`destination_visit_id`);--> statement-breakpoint
CREATE INDEX `place_name_idx` ON `place` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_external_id_provider_id_unique` ON `place_external_id` (`provider`,`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_external_id_place_provider_unique` ON `place_external_id` (`place_id`,`provider`);--> statement-breakpoint
CREATE INDEX `place_external_id_place_idx` ON `place_external_id` (`place_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_visit_day_sequence_unique` ON `place_visit` (`day_id`,`sequence`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_visit_day_source_ref_unique` ON `place_visit` (`day_id`,`source_ref`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_visit_revision_source_ref_unique` ON `place_visit` (`revision_id`,`source_ref`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_visit_id_revision_unique` ON `place_visit` (`id`,`revision_id`);--> statement-breakpoint
CREATE INDEX `place_visit_day_idx` ON `place_visit` (`day_id`);--> statement-breakpoint
CREATE INDEX `place_visit_revision_idx` ON `place_visit` (`revision_id`);--> statement-breakpoint
CREATE INDEX `place_visit_place_idx` ON `place_visit` (`place_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);