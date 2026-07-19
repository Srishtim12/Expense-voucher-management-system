import { Router } from "express";
import { eq, and, count, sum, gte, desc } from "drizzle-orm";
import { db, vouchersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// GET /dashboard/employee
router.get("/dashboard/employee", requireAuth, requireRole("employee"), async (req, res): Promise<void> => {
  const user = req.user!;

  const [stats] = await db
    .select({
      total: count(),
      totalAmount: sum(vouchersTable.amount),
    })
    .from(vouchersTable)
    .where(eq(vouchersTable.employeeUserId, user.id));

  const statusCounts = await db
    .select({ status: vouchersTable.status, count: count() })
    .from(vouchersTable)
    .where(eq(vouchersTable.employeeUserId, user.id))
    .groupBy(vouchersTable.status);

  const recentVouchers = await db
    .select({
      id: vouchersTable.id,
      voucherNumber: vouchersTable.voucherNumber,
      employeeName: vouchersTable.employeeName,
      amount: vouchersTable.amount,
      status: vouchersTable.status,
      updatedAt: vouchersTable.updatedAt,
    })
    .from(vouchersTable)
    .where(eq(vouchersTable.employeeUserId, user.id))
    .orderBy(desc(vouchersTable.updatedAt))
    .limit(5);

  const countMap = Object.fromEntries(statusCounts.map((s) => [s.status, Number(s.count)]));

  res.json({
    total: Number(stats.total),
    draft: countMap["draft"] ?? 0,
    submitted: countMap["submitted"] ?? 0,
    pendingApproval: countMap["pending_approval"] ?? 0,
    approved: countMap["approved"] ?? 0,
    rejected: countMap["rejected"] ?? 0,
    totalAmount: Number(stats.totalAmount ?? 0),
    recentVouchers: recentVouchers.map((v) => ({
      ...v,
      amount: Number(v.amount),
      updatedAt: v.updatedAt.toISOString(),
    })),
  });
});

// GET /dashboard/director
router.get("/dashboard/director", requireAuth, requireRole("director"), async (req, res): Promise<void> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [pending] = await db
    .select({ count: count(), amount: sum(vouchersTable.amount) })
    .from(vouchersTable)
    .where(eq(vouchersTable.status, "pending_approval"));

  const [approvedToday] = await db
    .select({ count: count() })
    .from(vouchersTable)
    .where(and(eq(vouchersTable.status, "approved"), gte(vouchersTable.approvalDate, todayStart)));

  const [rejectedToday] = await db
    .select({ count: count() })
    .from(vouchersTable)
    .where(
      and(
        eq(vouchersTable.status, "rejected"),
        gte(vouchersTable.updatedAt, todayStart)
      )
    );

  const recentActivity = await db
    .select({
      id: vouchersTable.id,
      voucherNumber: vouchersTable.voucherNumber,
      employeeName: vouchersTable.employeeName,
      amount: vouchersTable.amount,
      status: vouchersTable.status,
      updatedAt: vouchersTable.updatedAt,
    })
    .from(vouchersTable)
    .orderBy(desc(vouchersTable.updatedAt))
    .limit(10);

  res.json({
    pendingApprovals: Number(pending.count),
    approvedToday: Number(approvedToday.count),
    rejectedToday: Number(rejectedToday.count),
    pendingAmount: Number(pending.amount ?? 0),
    recentActivity: recentActivity.map((v) => ({
      ...v,
      amount: Number(v.amount),
      updatedAt: v.updatedAt.toISOString(),
    })),
  });
});

// GET /dashboard/accounts
router.get("/dashboard/accounts", requireAuth, requireRole("accounts"), async (req, res): Promise<void> => {
  const [stats] = await db
    .select({ total: count() })
    .from(vouchersTable);

  const statusCounts = await db
    .select({ status: vouchersTable.status, count: count() })
    .from(vouchersTable)
    .groupBy(vouchersTable.status);

  const [approvedAmount] = await db
    .select({ amount: sum(vouchersTable.amount) })
    .from(vouchersTable)
    .where(eq(vouchersTable.status, "approved"));

  const recentReimbursements = await db
    .select({
      id: vouchersTable.id,
      voucherNumber: vouchersTable.voucherNumber,
      employeeName: vouchersTable.employeeName,
      amount: vouchersTable.amount,
      status: vouchersTable.status,
      updatedAt: vouchersTable.updatedAt,
    })
    .from(vouchersTable)
    .where(eq(vouchersTable.status, "approved"))
    .orderBy(desc(vouchersTable.updatedAt))
    .limit(10);

  const countMap = Object.fromEntries(statusCounts.map((s) => [s.status, Number(s.count)]));

  res.json({
    total: Number(stats.total),
    approved: countMap["approved"] ?? 0,
    pending: (countMap["submitted"] ?? 0) + (countMap["pending_approval"] ?? 0),
    rejected: countMap["rejected"] ?? 0,
    totalApprovedAmount: Number(approvedAmount.amount ?? 0),
    recentReimbursements: recentReimbursements.map((v) => ({
      ...v,
      amount: Number(v.amount),
      updatedAt: v.updatedAt.toISOString(),
    })),
  });
});

export { router as dashboardRouter };
export default router;
