CREATE TABLE `trip` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	CONSTRAINT "trip_status_check" CHECK("status" in ('draft', 'confirmed'))
);
