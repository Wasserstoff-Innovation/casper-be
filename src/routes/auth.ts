import express from "express";
import controller from "../controller";

const router = express.Router();


router.get("/google-login", controller.auth.googleSignInSignUp)

export default router;