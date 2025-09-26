import authService from "./auth";
import BrandKitsService from "./brandKit";
import { CampaignPlanService } from "./campaign";
import { VisitedUserService } from "./visited";

export default {
  auth: authService,
  brandKits: BrandKitsService,
  visitedUsers: VisitedUserService,
  campaignPlans: CampaignPlanService,
};