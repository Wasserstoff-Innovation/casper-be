import { ca } from "zod/v4/locales";
import authService from "./auth";
import BrandKitsService from "./brandKit";
import { CampaignPlanService } from "./campaign";
import { VisitedUserService } from "./visited";
import CalendarService from "./calendar";

export default {
  auth: authService,
  brandKits: BrandKitsService,
  visitedUsers: VisitedUserService,
  campaignPlans: CampaignPlanService,
  calendar: CalendarService,
};