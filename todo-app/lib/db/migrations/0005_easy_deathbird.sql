CREATE TABLE "task_presence" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"mode" text DEFAULT 'editing' NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_presence" ADD CONSTRAINT "task_presence_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_presence" ADD CONSTRAINT "task_presence_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_presence" ADD CONSTRAINT "task_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "task_presence_task_id_user_id_unique" ON "task_presence" USING btree ("task_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_presence_org_id_task_id_user_id_unique" ON "task_presence" USING btree ("org_id","task_id","user_id");