import { Router } from "express";
import { Role } from "@prisma/client";
import ServiceCatalogController from "./service.controller";
import { createCategorySchema, createServiceSchema, setPricingSchema } from "./service.validation";
import validate from "../../middlewares/validate";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";

const router = Router();

// Public routes for mobile apps
router.get("/categories", ServiceCatalogController.getCategories);
router.get("/category/:categoryId", ServiceCatalogController.getServices);
router.get("/pricing/check", ServiceCatalogController.getPricing);

// Admin-only management endpoints
router.post(
  "/categories",
  authenticate,
  requireRoles([Role.ADMIN]),
  validate(createCategorySchema),
  ServiceCatalogController.createCategory
);

router.post(
  "/",
  authenticate,
  requireRoles([Role.ADMIN]),
  validate(createServiceSchema),
  ServiceCatalogController.createService
);

router.post(
  "/pricing",
  authenticate,
  requireRoles([Role.ADMIN]),
  validate(setPricingSchema),
  ServiceCatalogController.setPricing
);

// Admin APIs (Temporarily exposed without JWT auth for local Admin App)
router.get("/admin/categories", ServiceCatalogController.listAllCategories);
router.post("/admin/categories", ServiceCatalogController.createCategoryAdmin);
router.get("/admin/all", ServiceCatalogController.listAllServices);
router.post("/admin/services", ServiceCatalogController.createServiceAdmin);
router.patch("/admin/services/:id/toggle", ServiceCatalogController.toggleServiceActive);
router.delete("/admin/services/:id", ServiceCatalogController.deleteServiceAdmin);

export default router;
