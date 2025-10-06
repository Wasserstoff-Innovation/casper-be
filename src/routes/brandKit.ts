import express from "express";
import BrandKitController from "../controller/brandKit";
import multer from "multer";
import { authenticateUser } from "../middleware";

const router = express.Router();


const storage = multer.memoryStorage(); // keep files in memory
export const upload = multer({ storage });

router.post("/create",authenticateUser,upload.fields([{ name: "logo_file", maxCount: 1 },{ name: "mascot_file", maxCount: 1 },{ name: "additional_images", maxCount: 10 },{ name: "kit_data_json", maxCount: 1 },]),BrandKitController.createBrandKit);

router.get("/:kit_id",authenticateUser, BrandKitController.getBrandKit);
router.get("/:kit_id/report",authenticateUser, BrandKitController.getBrandKitReport);
export default router;
