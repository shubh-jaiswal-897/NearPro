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

export default router;
