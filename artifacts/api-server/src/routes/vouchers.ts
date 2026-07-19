import { Router } from "express";
import { eq, and, ilike, or, desc, asc, count, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import multer from "multer";
import { db, vouchersTable, usersTable } from "@workspace/db";
import {
  CreateVoucherBody,
  UpdateVoucherBody,
  UpdateVoucherParams,
  GetVoucherParams,
  DeleteVoucherParams,
  SubmitVoucherParams,
  ApproveVoucherBody,
  ApproveVoucherParams,
  RejectVoucherBody,
  RejectVoucherParams,
  ListVouchersQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Multer setup for signature uploads
const uploadDir = path.join(process.cwd(), "uploads", "signatures");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `sig_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function toDateString(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function generateVoucherNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `VCH-${year}${month}-${rand}`;
}

function voucherToResponse(v: typeof vouchersTable.$inferSelect) {
  return {
    ...v,
    amount: Number(v.amount),
    approvalDate: v.approvalDate ? v.approvalDate.toISOString() : null,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

// GET /vouchers
router.get("/vouchers", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const parsed = ListVouchersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search, department, sortBy, sortOrder, page = 1, limit = 20 } = parsed.data ?? {};
  const offset = ((page ?? 1) - 1) * (limit ?? 20);

  const conditions: ReturnType<typeof eq>[] = [];

  // Employees can only see their own vouchers
  if (user.role === "employee") {
    conditions.push(eq(vouchersTable.employeeUserId, user.id));
  }

  if (status) {
    conditions.push(
      eq(
        vouchersTable.status,
        status as "draft" | "submitted" | "pending_approval" | "approved" | "rejected"
      )
    );
  }

  if (department) {
    conditions.push(eq(vouchersTable.department, department));
  }

  if (search) {
    conditions.push(
      or(
        ilike(vouchersTable.voucherNumber, `%${search}%`),
        ilike(vouchersTable.expenseTitle, `%${search}%`),
        ilike(vouchersTable.employeeName, `%${search}%`)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderCol =
    sortBy === "amount"
      ? vouchersTable.amount
      : sortBy === "voucherDate"
        ? vouchersTable.voucherDate
        : sortBy === "expenseDate"
          ? vouchersTable.expenseDate
          : vouchersTable.createdAt;

  const orderDir = sortOrder === "asc" ? asc(orderCol) : desc(orderCol);

  const [vouchers, [{ total }]] = await Promise.all([
    db
      .select()
      .from(vouchersTable)
      .where(where)
      .orderBy(orderDir)
      .limit(limit ?? 20)
      .offset(offset),
    db
      .select({ total: count() })
      .from(vouchersTable)
      .where(where),
  ]);

  res.json({
    vouchers: vouchers.map(voucherToResponse),
    total: Number(total),
    page: page ?? 1,
    limit: limit ?? 20,
  });
});

// POST /vouchers
router.post("/vouchers", requireAuth, requireRole("employee"), async (req, res): Promise<void> => {
  const user = req.user!;
  const parsed = CreateVoucherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const voucherNumber = generateVoucherNumber();

  const [voucher] = await db
    .insert(vouchersTable)
    .values({
      voucherNumber,
      voucherDate: toDateString(data.voucherDate),
      expenseDate: toDateString(data.expenseDate),
      department: data.department,
      expenseTitle: data.expenseTitle,
      expenseCategory: data.expenseCategory,
      expenseDescription: data.expenseDescription ?? null,
      amount: String(data.amount),
      employeeName: user.name,
      employeeId: user.employeeId,
      employeeUserId: user.id,
      status: "draft",
    })
    .returning();

  res.status(201).json(voucherToResponse(voucher));
});

// GET /vouchers/:id
router.get("/vouchers/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const params = GetVoucherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [voucher] = await db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.id, params.data.id));

  if (!voucher) {
    res.status(404).json({ error: "Voucher not found" });
    return;
  }

  // Employees can only view their own vouchers
  if (user.role === "employee" && voucher.employeeUserId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(voucherToResponse(voucher));
});

// PATCH /vouchers/:id
router.patch("/vouchers/:id", requireAuth, requireRole("employee"), async (req, res): Promise<void> => {
  const user = req.user!;
  const params = UpdateVoucherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVoucherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Voucher not found" });
    return;
  }

  if (existing.employeeUserId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (existing.status !== "draft") {
    res.status(400).json({ error: "Only draft vouchers can be edited" });
    return;
  }

  const data = parsed.data;
  const updateValues: Partial<typeof vouchersTable.$inferInsert> = {};
  if (data.voucherDate !== undefined) updateValues.voucherDate = toDateString(data.voucherDate);
  if (data.expenseDate !== undefined) updateValues.expenseDate = toDateString(data.expenseDate);
  if (data.department !== undefined) updateValues.department = data.department;
  if (data.expenseTitle !== undefined) updateValues.expenseTitle = data.expenseTitle;
  if (data.expenseCategory !== undefined) updateValues.expenseCategory = data.expenseCategory;
  if (data.expenseDescription !== undefined) updateValues.expenseDescription = data.expenseDescription;
  if (data.amount !== undefined) updateValues.amount = String(data.amount);

  const [updated] = await db
    .update(vouchersTable)
    .set(updateValues)
    .where(eq(vouchersTable.id, params.data.id))
    .returning();

  res.json(voucherToResponse(updated));
});

// DELETE /vouchers/:id
router.delete("/vouchers/:id", requireAuth, requireRole("employee"), async (req, res): Promise<void> => {
  const user = req.user!;
  const params = DeleteVoucherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Voucher not found" });
    return;
  }

  if (existing.employeeUserId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (existing.status !== "draft") {
    res.status(400).json({ error: "Only draft vouchers can be deleted" });
    return;
  }

  await db.delete(vouchersTable).where(eq(vouchersTable.id, params.data.id));
  res.sendStatus(204);
});

// POST /vouchers/:id/submit
router.post("/vouchers/:id/submit", requireAuth, requireRole("employee"), async (req, res): Promise<void> => {
  const user = req.user!;
  const params = SubmitVoucherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Voucher not found" });
    return;
  }

  if (existing.employeeUserId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (existing.status !== "draft") {
    res.status(400).json({ error: "Only draft vouchers can be submitted" });
    return;
  }

  if (!existing.employeeSignatureUrl) {
    res.status(400).json({ error: "Employee signature is required before submitting" });
    return;
  }

  const [updated] = await db
    .update(vouchersTable)
    .set({ status: "pending_approval" })
    .where(eq(vouchersTable.id, params.data.id))
    .returning();

  res.json(voucherToResponse(updated));
});

// POST /vouchers/:id/approve
router.post("/vouchers/:id/approve", requireAuth, requireRole("director"), async (req, res): Promise<void> => {
  const user = req.user!;
  const params = ApproveVoucherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ApproveVoucherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Voucher not found" });
    return;
  }

  if (existing.status !== "pending_approval") {
    res.status(400).json({ error: "Only pending vouchers can be approved" });
    return;
  }

  const [updated] = await db
    .update(vouchersTable)
    .set({
      status: "approved",
      approvalDate: new Date(),
      approvedBy: user.id,
      approvedByName: user.name,
      directorSignatureUrl: parsed.data.directorSignatureUrl,
    })
    .where(eq(vouchersTable.id, params.data.id))
    .returning();

  res.json(voucherToResponse(updated));
});

// POST /vouchers/:id/reject
router.post("/vouchers/:id/reject", requireAuth, requireRole("director"), async (req, res): Promise<void> => {
  const params = RejectVoucherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RejectVoucherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Voucher not found" });
    return;
  }

  if (existing.status !== "pending_approval") {
    res.status(400).json({ error: "Only pending vouchers can be rejected" });
    return;
  }

  if (!parsed.data.rejectionReason) {
    res.status(400).json({ error: "Rejection reason is required" });
    return;
  }

  const [updated] = await db
    .update(vouchersTable)
    .set({
      status: "rejected",
      rejectionReason: parsed.data.rejectionReason,
    })
    .where(eq(vouchersTable.id, params.data.id))
    .returning();

  res.json(voucherToResponse(updated));
});

// POST /vouchers/:id/signature — Employee signature upload
router.post(
  "/vouchers/:id/signature",
  requireAuth,
  requireRole("employee"),
  upload.single("signature"),
  async (req, res): Promise<void> => {
    const user = req.user!;
    const idRaw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idRaw, 10);

    if (!req.file) {
      res.status(400).json({ error: "No signature file uploaded" });
      return;
    }

    const [existing] = await db
      .select()
      .from(vouchersTable)
      .where(eq(vouchersTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    if (existing.employeeUserId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const signatureUrl = `/api/uploads/signatures/${req.file.filename}`;

    const [updated] = await db
      .update(vouchersTable)
      .set({ employeeSignatureUrl: signatureUrl })
      .where(eq(vouchersTable.id, id))
      .returning();

    res.json(voucherToResponse(updated));
  }
);

// POST /vouchers/:id/director-signature
router.post(
  "/vouchers/:id/director-signature",
  requireAuth,
  requireRole("director"),
  upload.single("signature"),
  async (req, res): Promise<void> => {
    const idRaw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idRaw, 10);

    if (!req.file) {
      res.status(400).json({ error: "No signature file uploaded" });
      return;
    }

    const [existing] = await db
      .select()
      .from(vouchersTable)
      .where(eq(vouchersTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    const signatureUrl = `/api/uploads/signatures/${req.file.filename}`;

    const [updated] = await db
      .update(vouchersTable)
      .set({ directorSignatureUrl: signatureUrl })
      .where(eq(vouchersTable.id, id))
      .returning();

    res.json(voucherToResponse(updated));
  }
);

// Serve uploaded files
router.get("/uploads/signatures/:filename", (req, res): void => {
  const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const filePath = path.join(process.cwd(), "uploads", "signatures", filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filePath);
});

export { router as vouchersRouter };
export default router;
