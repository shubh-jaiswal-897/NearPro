import { Router } from "express";
import UserController from "./user.controller";

const router = Router();

// Admin APIs (Temporarily exposed without JWT auth for local Admin App)
router.get("/admin/all", UserController.listAll);
router.patch("/admin/:id/toggle-active", UserController.toggleActive);
router.delete("/admin/:id", UserController.delete);

export default router;
