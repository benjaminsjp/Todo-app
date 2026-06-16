ALTER TABLE "statuses" ADD COLUMN IF NOT EXISTS "icon" text;
UPDATE "statuses" SET "icon" = 'CircleDashed' WHERE "color" = 'gray' AND "icon" IS NULL;
UPDATE "statuses" SET "icon" = 'CircleEllipsis' WHERE "color" = 'blue' AND "icon" IS NULL;
UPDATE "statuses" SET "icon" = 'CircleCheck' WHERE "color" = 'green' AND "icon" IS NULL;
