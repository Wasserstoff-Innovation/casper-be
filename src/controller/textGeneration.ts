// src/controllers/twitter.controller.ts
import { Request, Response } from "express";
import { textGenerationService } from "../services/textGeneration";

export class textGenerationController {
  static async generateTweet(req: Request, res: Response) {
    try {
      const result = await textGenerationService.generateTweet(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("❌ Controller error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate tweet",
      });
    }
  }

   static async interactTweet(req: Request, res: Response) {
    try {
      const result = await textGenerationService.interactTweet(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("❌ Controller error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate interaction",
      });
    }
  }

   static async generateThreads(req: Request, res: Response) {
    try {
      const result = await textGenerationService.generateThreads(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("❌ Controller error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate threads post",
      });
    }
  }

   static async generateLinkedIn(req: Request, res: Response) {
    try {
      const data = await textGenerationService.generateLinkedIn(req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async generateMedium(req: Request, res: Response) {
    try {
      const data = await textGenerationService.generateMedium(req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async generateBlogger(req: Request, res: Response) {
    try {
      console.log("Request body:", req.body);
      const data = await textGenerationService.generateBlogger(req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

}
