import express from "express";
import BrandKitController from "../controller/brandKit";
import multer from "multer";
import { authenticateUser } from "../middleware";

const router = express.Router();

const storage = multer.memoryStorage();
export const upload = multer({ storage });

// ============================================
// UNIFIED BRAND KIT ENDPOINTS (NEW)
// ============================================
// These are the primary endpoints for the brand kit dialog.
// All brand data is in `comprehensive` - single source of truth.
// User edits update the SAME fields that analysis populates.

// GET - Get complete brand kit (comprehensive data + UI config)
router.get(
  "/comprehensive/:profile_id",
  authenticateUser,
  BrandKitController.getComprehensiveBrandKit
);

// PATCH - Update a single field (deep path update)
// Body: { path: "visual_identity.color_system.primary_colors.items[0].hex", value: "#FF0000" }
router.patch(
  "/comprehensive/:profile_id/field",
  authenticateUser,
  BrandKitController.updateComprehensiveField
);

// PATCH - Update an entire section
// Body: { section: "visual_identity", data: { ... } }
router.patch(
  "/comprehensive/:profile_id/section",
  authenticateUser,
  BrandKitController.updateComprehensiveSection
);

// PUT - Update visual kit UI configuration (slides, export settings)
// Body: { slides: [...], settings: { aspectRatio, exportFormat, ... } }
router.put(
  "/comprehensive/:profile_id/visual-config",
  authenticateUser,
  BrandKitController.updateVisualKitConfig
);

// POST - Regenerate from analysis (preserves user edits)
router.post(
  "/comprehensive/:profile_id/regenerate",
  authenticateUser,
  BrandKitController.regenerateFromAnalysis
);

// ============================================
// LEGACY ENDPOINTS (for backwards compatibility)
// ============================================

// Create brand kit from v2 brand profile (auto-generate from intelligence data)
router.post(
  "/create-from-profile",
  authenticateUser,
  BrandKitController.createBrandKitFromProfile
);

// Create brand kit manually (without AI analysis)
router.post(
  "/create-manual",
  authenticateUser,
  BrandKitController.createManualBrandKit
);

// Legacy: Create brand kit with manual data and file uploads
router.post(
  "/create",
  authenticateUser,
  upload.fields([
    { name: "logo_file", maxCount: 1 },
    { name: "mascot_file", maxCount: 1 },
    { name: "additional_images", maxCount: 10 },
    { name: "kit_data_json", maxCount: 1 },
  ]),
  BrandKitController.createBrandKit
);

// Get brand kit by profile ID (legacy format)
router.get(
  "/by-profile/:profile_id",
  authenticateUser,
  BrandKitController.getBrandKitByProfileId
);

// Get brand kit by kit ID (legacy format)
router.get("/:kit_id", authenticateUser, BrandKitController.getBrandKit);

// Get brand kit report (HTML)
router.get("/:kit_id/report", authenticateUser, BrandKitController.getBrandKitReport);

export default router;
