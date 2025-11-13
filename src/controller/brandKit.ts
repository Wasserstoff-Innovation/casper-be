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
      console.log("inside the getBrandKit",kitId)
      const brandKit = await BrandKitsService.fetchBrandKit(kitId);
  
      if (!brandKit) {
        return res.status(404).json({ message: "Brand Kit not found" });
      }

      res.status(200).json(brandKit);
    } catch (error: any) {
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
