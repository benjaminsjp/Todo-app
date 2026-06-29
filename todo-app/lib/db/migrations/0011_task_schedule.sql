ALTER TABLE "tasks" ADD COLUMN "start_at" timestamp;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "end_at" timestamp;
--> statement-breakpoint
UPDATE "tasks"
SET "end_at" = CASE
  WHEN "deadline" IS NULL OR trim("deadline") = '' THEN NULL
  WHEN "deadline" ~ '^\d{4}-\d{2}-\d{2}' THEN ("deadline"::date + TIME '17:00:00')
  WHEN "deadline" ~ '^\d{2}\.\d{2}\.\d{4}' THEN (to_timestamp("deadline", 'DD.MM.YYYY') + INTERVAL '17 hours')
  ELSE NULL
END
WHERE "deadline" IS NOT NULL AND trim("deadline") != '';
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "deadline";
