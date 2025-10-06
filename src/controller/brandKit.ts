import { Request, Response } from "express";
import BrandKitsService from "../services/brandKit";

export default class BrandKitController {
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
