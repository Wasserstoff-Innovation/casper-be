import express from "express";
import controller from "../controller";
import { authenticateUser } from "../middleware";

const router = express.Router();


router.get("/google-login", controller.auth.googleSignInSignUp)
router.get("/user", authenticateUser,controller.auth.getUser)

export default router;