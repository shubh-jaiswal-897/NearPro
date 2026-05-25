import { Router } from "express";
import AuthController from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.validation";
import validate from "../../middlewares/validate";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.get("/me", authenticate, AuthController.getMe);

export default router;
