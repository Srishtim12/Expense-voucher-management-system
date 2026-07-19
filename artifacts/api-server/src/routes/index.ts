import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import { vouchersRouter } from "./vouchers.js";
import { dashboardRouter } from "./dashboard.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(vouchersRouter);
router.use(dashboardRouter);

export default router;
