import authService from "./auth";
import BrandKitsService from "./brandKit";
import { CampaignService } from "./campaign";
import { VisitedUserService } from "./visited";
import CalendarService from "./calendar";

export default {
  auth: authService,
  brandKits: BrandKitsService,
  visitedUsers: VisitedUserService,
  campaign: CampaignService,
  calendar: CalendarService,
};