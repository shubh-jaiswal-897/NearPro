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

export default router;
