import { Request, Response } from "express";
import BrandKitsService from "../services/brandKit";

export default class BrandKitController {
  
  // NEW: Auto-create brand kit from v2 brand profile
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

      const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;
      const brandProfileId = (req.body.brandProfileId);
      console.log("userId and brandProfileId",userId,brandProfileId);
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

   static async getBrandKit(req: Request, res: Response) {
    try {
      const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;
      const kitId = req.params.kit_id;
      const profileId = req.query.profile_id as string; // Optional: get by profile ID
      const includeRaw = req.query.include_raw === 'true'; // Optional: include v2_raw for debug
      
      console.log("Getting brand kit", { kitId, profileId, includeRaw });
      
      let brandKit;
      
      // If profile_id is provided, use the new method that checks both DB and API
      if (profileId) {
        brandKit = await BrandKitsService.getBrandKitByProfileId(profileId);
        
        // If null, it means data exists but needs re-analysis
        if (brandKit === null) {
          return res.status(202).json({ 
            message: "Brand kit data exists but needs transformation. Call /re-analyze endpoint.",
            profile_id: profileId,
            action_required: "re_analyze"
          });
        }
      } else {
        // Use kit ID
        brandKit = await BrandKitsService.fetchBrandKit(kitId);
      }
  
      if (!brandKit) {
        return res.status(404).json({ message: "Brand Kit not found" });
      }

      // Transform response: comprehensive is primary, v2_raw is optional
      // Handle both new format (with comprehensive) and legacy format
      if (brandKit.comprehensive) {
        // New format: comprehensive is primary
        const response: any = {
          // Primary: comprehensive brand kit structure (spread at root level)
          // This makes all sections (meta, visual_identity, etc.) available at root
          ...brandKit.comprehensive,
          // Metadata
          _meta: {
            format_version: brandKit.format_version || '2.0',
            source: brandKit.source,
            generated_at: brandKit.generated_at,
          }
        };

        // Include brand scores and roadmap from v2_raw if available (needed for UI)
        if (brandKit.v2_raw) {
          if (brandKit.v2_raw.brand_scores) {
            response._scores = brandKit.v2_raw.brand_scores;
          }
          if (brandKit.v2_raw.brand_roadmap) {
            response._roadmap = brandKit.v2_raw.brand_roadmap;
          }
        }

        // Only include full v2_raw if explicitly requested (for debug/advanced views)
        if (includeRaw && brandKit.v2_raw) {
          response._debug = {
            v2_raw: brandKit.v2_raw
          };
        }

        res.status(200).json(response);
      } else {
        // Legacy format: return as-is but warn
        console.warn('⚠️ Legacy brand kit format detected - missing comprehensive structure');
        res.status(200).json({
          ...brandKit,
          _meta: {
            format_version: '1.0',
            source: 'legacy',
            warning: 'Legacy format - may need re-analysis for full features'
          }
        });
      }
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  // NEW: Create brand kit manually (without AI analysis)
  static createManualBrandKit = async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = user.userId;
      const { kitData } = req.body;
      
      console.log("Creating manual brand kit", { userId });
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      if (!kitData || !kitData.comprehensive) {
        return res.status(400).json({ error: "kitData.comprehensive is required" });
      }

      // Validate required fields
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
      console.log("inside the getBrandKitReport")
      const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;
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
