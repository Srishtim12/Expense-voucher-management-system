CREATE TYPE "public"."user_role" AS ENUM('employee', 'director', 'accounts');--> statement-breakpoint
CREATE TYPE "public"."voucher_status" AS ENUM('draft', 'submitted', 'pending_approval', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"employee_id" text NOT NULL,
	"department" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_number" text NOT NULL,
	"voucher_date" date NOT NULL,
	"expense_date" date NOT NULL,
	"department" text NOT NULL,
	"expense_title" text NOT NULL,
	"expense_category" text NOT NULL,
	"expense_description" text,
	"amount" numeric(12, 2) NOT NULL,
	"employee_name" text NOT NULL,
	"employee_id" text NOT NULL,
	"employee_user_id" integer NOT NULL,
	"employee_signature_url" text,
	"director_signature_url" text,
	"approval_date" timestamp with time zone,
	"status" "voucher_status" DEFAULT 'draft' NOT NULL,
	"rejection_reason" text,
	"approved_by" integer,
	"approved_by_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_employee_user_id_users_id_fk" FOREIGN KEY ("employee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;