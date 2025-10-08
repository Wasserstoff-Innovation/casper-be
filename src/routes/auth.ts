import express from "express";
import controller from "../controller";
import { authenticateUser } from "../middleware";

const router = express.Router();


router.get("/google-login", controller.auth.googleSignInSignUp)
router.get('/apple-login', controller.auth.appleSignIn);
router.get("/user", authenticateUser,controller.auth.getUser)
router.post("/calander-data", authenticateUser,controller.auth.getCalendarData)

export default router;