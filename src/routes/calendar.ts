import { create } from "domain";
import  { Router } from "express";
import CalendarController from "../controller/calendar";
import { authenticateUser } from "../middleware";

const router = Router();

router.post("/create",authenticateUser, CalendarController.createCalendar);
router.get("/:id",authenticateUser, CalendarController.getCalendar);

export default router;