import { Router } from "express";
import CalendarController from "../controller/calendar";
import { authenticateUser } from "../middleware";

const router = Router();

// Step 4b: Poll for calendar job result
// GET /api/v1/calendars/jobs/:job_id
router.get("/jobs/:job_id", authenticateUser, CalendarController.getCalendarJob);

export default router;