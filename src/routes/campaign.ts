import { Router } from "express";
import { ca } from "zod/v4/locales";
import { CampaignPlanController } from "../controller/campaign";

const router = Router();

router.post("/create", CampaignPlanController.createCampaignPlan);
router.get('/:id', CampaignPlanController.getCampaignPlan);
router.post('/:id/recommendations', CampaignPlanController.getAiRecommendations);
router.post('/:id/finalize', CampaignPlanController.finalizeCampaignPlan);
export default router;
