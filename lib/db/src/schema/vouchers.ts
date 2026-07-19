import { pgTable, text, serial, timestamp, numeric, integer, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const voucherStatusEnum = pgEnum("voucher_status", [
  "draft",
  "submitted",
  "pending_approval",
  "approved",
  "rejected",
]);

export const vouchersTable = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  voucherNumber: text("voucher_number").notNull().unique(),
  voucherDate: date("voucher_date", { mode: "string" }).notNull(),
  expenseDate: date("expense_date", { mode: "string" }).notNull(),
  department: text("department").notNull(),
  expenseTitle: text("expense_title").notNull(),
  expenseCategory: text("expense_category").notNull(),
  expenseDescription: text("expense_description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  employeeName: text("employee_name").notNull(),
  employeeId: text("employee_id").notNull(),
  employeeUserId: integer("employee_user_id")
    .notNull()
    .references(() => usersTable.id),
  employeeSignatureUrl: text("employee_signature_url"),
  directorSignatureUrl: text("director_signature_url"),
  approvalDate: timestamp("approval_date", { withTimezone: true }),
  status: voucherStatusEnum("status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  approvedBy: integer("approved_by").references(() => usersTable.id),
  approvedByName: text("approved_by_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVoucherSchema = createInsertSchema(vouchersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchersTable.$inferSelect;
