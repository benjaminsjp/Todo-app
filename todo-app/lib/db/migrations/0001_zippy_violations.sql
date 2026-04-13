ALTER TABLE "task_groups" DROP CONSTRAINT "task_groups_org_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_org_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "task_groups" ALTER COLUMN "org_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "org_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "task_groups" ADD CONSTRAINT "task_groups_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;