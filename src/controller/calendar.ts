import { Request, Response } from "express";
import CalendarService from "../services/calendar";

export default class CalendarController {

  /**
   * Step 2: Generate calendar (creates plan + generates calendar in one call)
   * POST /api/v1/brands/:brand_id/generate-calendar
   * Body: {
   *   selected_platforms: string[],
   *   selected_duration_weeks: number,
   *   posting_frequency_per_week: number,
   *   start_date: string (YYYY-MM-DD),
   *   campaign_purpose?: string,
   *   content_ideas?: string[]
   * }
   */
  static async generateBrandCalendar(req: Request, res: Response) {
    try {
      const user: any = req.user;
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const brand_id = req.params.brand_id;
      if (!brand_id) {
        return res.status(400).json({ message: "brand_id is required" });
      }

      const {
        selected_platforms,
        selected_duration_weeks,
        posting_frequency_per_week,
        start_date,
        campaign_purpose,
        content_ideas
      } = req.body;

      // Validation
      if (!selected_platforms || !Array.isArray(selected_platforms) || selected_platforms.length === 0) {
        return res.status(400).json({ message: "selected_platforms is required (array)" });
      }
      if (!selected_duration_weeks || typeof selected_duration_weeks !== "number") {
        return res.status(400).json({ message: "selected_duration_weeks is required (number)" });
      }
      if (!posting_frequency_per_week || typeof posting_frequency_per_week !== "number") {
        return res.status(400).json({ message: "posting_frequency_per_week is required (number)" });
      }
      if (!start_date) {
        return res.status(400).json({ message: "start_date is required (YYYY-MM-DD)" });
      }

      const result = await CalendarService.generateBrandCalendar(
        user.userId,
        brand_id,
        {
          selected_platforms,
          selected_duration_weeks,
          posting_frequency_per_week,
          start_date,
          campaign_purpose,
          content_ideas
        }
      );

      return res.status(202).json(result);
    } catch (error: any) {
      console.error("Generate Brand Calendar Error:", error);
      if (error.message === "Brand profile not found") {
        return res.status(404).json({ message: "Brand profile not found" });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Step 3: Poll for calendar job result
   * GET /api/v1/calendars/jobs/:job_id
   */
  static async getCalendarJob(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const job_id = req.params.job_id;
      if (!job_id) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      const result = await CalendarService.getCalendarJob(job_id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Get Calendar Job Error:", error);
      return res.status(500).json({ message: error.message });
    }
  }
}
