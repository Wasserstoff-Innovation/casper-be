import { Request, Response } from "express";
import BrandKitsService from "../services/brandKit";
import { ComprehensiveBrandKit, VisualKitUIConfig } from "../types/brandKit";

export default class BrandKitController {
  
  // ============================================
  // UNIFIED BRAND KIT ENDPOINTS
  // ============================================

  /**
   * GET /brand-kits/comprehensive/:profile_id
   * Get the complete brand kit with all data and UI config.
   * This is the primary endpoint for the brand kit dialog.
   */
  static async getComprehensiveBrandKit(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileId = req.params.profile_id;
      console.log("Getting comprehensive brand kit for profile:", profileId);

      const result = await BrandKitsService.getComprehensiveBrandKit(profileId);
      
      if (!result) {
        return res.status(404).json({ error: "Brand kit not found" });
      }

      return res.status(200).json({
        success: true,
        brandKitId: result.brandKitId,
        comprehensive: result.comprehensive,
        visualKitConfig: result.visualKitConfig,
        dataQuality: result.dataQuality,
      });
    } catch (error: any) {
      console.error("Error getting comprehensive brand kit:", error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /brand-kits/comprehensive/:profile_id/field
   * Update a single field in the comprehensive brand kit.
   * Body: { path: "visual_identity.color_system.primary_colors.items[0].hex", value: "#FF0000" }
   */
  static async updateComprehensiveField(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileId = req.params.profile_id;
      const { path, value } = req.body;

      if (!path) {
        return res.status(400).json({ error: "path is required" });
      }

      console.log(`Updating field ${path} for profile ${profileId}`);

      const result = await BrandKitsService.updateComprehensiveField(profileId, path, value);
      
      return res.status(200).json({
        success: true,
        path: result.path,
        newValue: result.newValue,
        message: `Field ${path} updated successfully`,
      });
    } catch (error: any) {
      console.error("Error updating comprehensive field:", error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /brand-kits/comprehensive/:profile_id/section
   * Update an entire section of the comprehensive brand kit.
   * Body: { section: "visual_identity", data: { ... } }
   */
  static async updateComprehensiveSection(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileId = req.params.profile_id;
      const { section, data } = req.body;

      const validSections: (keyof ComprehensiveBrandKit)[] = [
        'meta',
        'visual_identity',
        'verbal_identity',
        'audience_positioning',
        'product_offers',
        'proof_trust',
        'seo_identity',
        'external_presence',
        'content_assets',
        'competitor_analysis',
        'contact_info',
        'gaps_summary',
      ];

      if (!section || !validSections.includes(section)) {
        return res.status(400).json({
          error: `Invalid section. Must be one of: ${validSections.join(', ')}`,
        });
      }

      if (!data) {
        return res.status(400).json({ error: "data is required" });
      }

      console.log(`Updating section ${section} for profile ${profileId}`);

      const result = await BrandKitsService.updateComprehensiveSection(profileId, section, data);
      
      return res.status(200).json({
        success: true,
        section: result.section,
        message: `Section ${section} updated successfully`,
      });
    } catch (error: any) {
      console.error("Error updating comprehensive section:", error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /brand-kits/comprehensive/:profile_id/visual-config
   * Update visual kit UI configuration (slides, export settings).
   * This updates presentation settings, NOT brand data.
   */
  static async updateVisualKitConfig(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileId = req.params.profile_id;
      const { slides, settings } = req.body;

      if (!slides && !settings) {
        return res.status(400).json({ error: "slides or settings is required" });
      }

      console.log(`Updating visual kit config for profile ${profileId}`);

      const result = await BrandKitsService.updateVisualKitConfig(profileId, { slides, settings });
      
      return res.status(200).json({
        success: true,
        visualKitConfig: result.visualKitConfig,
        message: "Visual kit configuration updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating visual kit config:", error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /brand-kits/comprehensive/:profile_id/regenerate
   * Regenerate comprehensive structure from latest analysis data.
   * Preserves user edits.
   */
  static async regenerateFromAnalysis(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileId = req.params.profile_id;
      console.log(`Regenerating brand kit from analysis for profile ${profileId}`);

      const result = await BrandKitsService.regenerateFromAnalysis(profileId);
      
      return res.status(200).json({
        success: true,
        comprehensive: result.comprehensive,
        dataQuality: result.dataQuality,
        message: "Brand kit regenerated from analysis (user edits preserved)",
      });
    } catch (error: any) {
      console.error("Error regenerating from analysis:", error.message);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // LEGACY ENDPOINTS (for backwards compatibility)
  // ============================================

  static createBrandKitFromProfile = async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = user.userId;
      const { brandProfileId } = req.body;
      
      console.log("Creating brand kit from v2 profile", { userId, brandProfileId });
      
      if (!userId || !brandProfileId) {
        return res.status(400).json({ error: "userId and brandProfileId are required" });
      }

      const result = await BrandKitsService.createBrandKitFromV2Profile(userId, brandProfileId);
      res.status(201).json(result);
      
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };

  static createBrandKit = async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const kitDataJson = JSON.parse(req.body.kit_data_json);

      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = user.userId;
      const brandProfileId = req.body.brandProfileId;
      
      if (!userId || !brandProfileId) {
        return res.status(400).json({ error: "userId and brandProfileId are required" });
      }

      const fileMap: any = {};
      if (files?.logo_file) fileMap.logo_file = files.logo_file[0];
      if (files?.mascot_file) fileMap.mascot_file = files.mascot_file[0];
      if (files?.additional_images) fileMap.additional_images = files.additional_images;

      const result = await BrandKitsService.createBrandKit(
        userId,
        brandProfileId,
        kitDataJson,
        fileMap
      );

      res.status(201).json(result);
    } catch (err: any) {
      console.error(err);
      res.status(err.response?.status || 500).json({ error: err.message });
    }
  };

  static async getBrandKitByProfileId(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileId = req.params.profile_id;
      const includeRaw = req.query.include_raw === 'true';

      console.log("Getting brand kit by profile ID", { profileId, includeRaw });

      const brandKit = await BrandKitsService.getBrandKitByProfileId(profileId);

      if (brandKit === null) {
        return res.status(202).json({
          message: "Brand kit data exists but needs transformation. Call /re-analyze endpoint.",
          profile_id: profileId,
          action_required: "re_analyze"
        });
      }

      if (!brandKit) {
        return res.status(404).json({ message: "Brand Kit not found" });
      }

      return BrandKitController.formatBrandKitResponse(res, brandKit, includeRaw);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getBrandKit(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const kitId = req.params.kit_id;
      const includeRaw = req.query.include_raw === 'true';

      console.log("Getting brand kit by kit ID", { kitId, includeRaw });

      const brandKit = await BrandKitsService.fetchBrandKit(kitId);

      if (!brandKit) {
        return res.status(404).json({ message: "Brand Kit not found" });
      }

      return BrandKitController.formatBrandKitResponse(res, brandKit, includeRaw);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  private static formatBrandKitResponse(res: Response, brandKit: any, includeRaw: boolean) {
    if (brandKit.comprehensive) {
      const response: any = {
        ...brandKit.comprehensive,
        _meta: {
          format_version: brandKit.format_version || '2.0',
          source: brandKit.source,
          generated_at: brandKit.generated_at,
        }
      };

      if (brandKit.v2_raw) {
        if (brandKit.v2_raw.brand_scores) {
          response._scores = brandKit.v2_raw.brand_scores;
        }
        if (brandKit.v2_raw.brand_roadmap) {
          response._roadmap = brandKit.v2_raw.brand_roadmap;
        }
      }

      if (includeRaw && brandKit.v2_raw) {
        response._debug = {
          v2_raw: brandKit.v2_raw
        };
      }

      return res.status(200).json(response);
    } else {
      console.warn('⚠️ Legacy brand kit format detected');
      return res.status(200).json({
        ...brandKit,
        _meta: {
          format_version: '1.0',
          source: 'legacy',
          warning: 'Legacy format - may need re-analysis for full features'
        }
      });
    }
  }

  static createManualBrandKit = async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = user.userId;
      const { kitData } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      if (!kitData || !kitData.comprehensive) {
        return res.status(400).json({ error: "kitData.comprehensive is required" });
      }

      if (!kitData.comprehensive.meta?.brand_name?.value) {
        return res.status(400).json({ error: "brand_name is required" });
      }
      if (!kitData.comprehensive.meta?.canonical_domain?.value) {
        return res.status(400).json({ error: "canonical_domain is required" });
      }
      if (!kitData.comprehensive.visual_identity?.logos?.primary_logo_url?.value) {
        return res.status(400).json({ error: "primary_logo_url is required" });
      }

      const result = await BrandKitsService.createManualBrandKit(userId, kitData);
      res.status(201).json(result);
      
    } catch (err: any) {
      console.error("Error creating manual brand kit:", err);
      res.status(500).json({ error: err.message });
    }
  };

  static async getBrandKitReport(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const kitId = req.params.kit_id;
      const reportHtml = await BrandKitsService.fetchBrandKitReport(kitId);

      if (!reportHtml) {
        return res.status(404).send("Brand Kit report not found");
      }

      res.status(200).contentType("text/html").send(reportHtml);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
