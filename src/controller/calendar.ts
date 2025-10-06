import { Request, Response } from "express";
import CalendarService from "../services/calendar";

export default class CalendarController {
  static async createCalendar(req: Request, res: Response) {
    try {
      const user:any = req.user;
      console.log("user........",user)
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const payload = req.body;
      console.log("payload........",payload)
      if (!payload) {
        return res.status(400).json({ message: "Calendar data is required" });
      }

      const calendar = await CalendarService.createCalendar(payload);
      console.log("calendar........",calendar)  
      return res.status(201).json({ 
        calendar,
      });
    } catch (error: any) {
      console.log("error........",error)
      if(error.message === "campaign plan not finalized yet"){
        return res.status(400).json({
          message: "Plan must be finalized before creating a content calendar",
          calendar: null,
        });
      }
      return res.status(500).json({ message: error.message });
    }
  }
  
  static async getCalendar(req: Request, res: Response) {
    try {
      const user:any = req.user;
      if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
     }
      const userId = user.userId;
      const job_id = req.params.id;
      console.log("calendarId........",job_id)
      if (!job_id || job_id === undefined) {
        return res.status(400).json({ message: "Calendar ID is required" });
      }

      const calendar = await CalendarService.getCalendar(job_id);
      console.log("calendar........",calendar)
      return res.status(200).json({ job_id, calendar});
    } catch (error: any) {
      console.log("error........",error)
      return res.status(500).json({ message: error.message });
    }
  }
} 