import express from "express";
import BrandKitController from "../controller/brandKit";
import multer from "multer";
import { authenticateUser } from "../middleware";

const router = express.Router();


const storage = multer.memoryStorage(); // keep files in memory
export const upload = multer({ storage });

// NEW: Create brand kit from v2 brand profile (auto-generate from intelligence data)
router.post("/create-from-profile", authenticateUser, BrandKitController.createBrandKitFromProfile);

// NEW: Create brand kit manually (without AI analysis)
router.post("/create-manual", authenticateUser, BrandKitController.createManualBrandKit);

// Legacy: Create brand kit with manual data and file uploads
router.post("/create",authenticateUser,upload.fields([{ name: "logo_file", maxCount: 1 },{ name: "mascot_file", maxCount: 1 },{ name: "additional_images", maxCount: 10 },{ name: "kit_data_json", maxCount: 1 },]),BrandKitController.createBrandKit);

// NEW: Get brand kit by profile ID (must come before /:kit_id to avoid route conflict)
router.get("/by-profile/:profile_id", authenticateUser, BrandKitController.getBrandKitByProfileId);

// Get brand kit by kit ID
router.get("/:kit_id",authenticateUser, BrandKitController.getBrandKit);
router.get("/:kit_id/report",authenticateUser, BrandKitController.getBrandKitReport);
export default router;
