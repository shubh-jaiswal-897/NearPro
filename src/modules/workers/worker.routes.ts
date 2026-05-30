import { Router } from "express";
import { Role } from "@prisma/client";
import WorkerController from "./worker.controller";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";

const router = Router();

router.patch(
  "/toggle-online",
  authenticate,
  requireRoles([Role.WORKER]),
  WorkerController.toggleOnline
);

router.get(
  "/stats",
  authenticate,
  requireRoles([Role.WORKER]),
  WorkerController.getStats
);

// Admin APIs (Temporarily exposed without JWT auth for local Admin App)
router.get("/admin/pending", WorkerController.listPending);
router.get("/admin/all", WorkerController.listAll);
router.patch("/admin/:id/approve", WorkerController.approve);
router.delete("/admin/:id/reject", WorkerController.reject);

export default router;
