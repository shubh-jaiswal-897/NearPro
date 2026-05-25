import { Router } from "express";
import { Role } from "@prisma/client";
import CityController from "./city.controller";
import { createCitySchema } from "./city.validation";
import validate from "../../middlewares/validate";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", CityController.getCities);
router.get("/check-geofence", CityController.checkGeofence);

// Only admin can configure city operational boundaries
router.post(
  "/",
  authenticate,
  requireRoles([Role.ADMIN]),
  validate(createCitySchema),
  CityController.createCity
);

export default router;
