import { Router } from "express";
import { ca } from "zod/v4/locales";
import { CampaignPlanController } from "../controller/campaign";
import { authenticateUser } from "../middleware";
import { validateCampaign } from "../validators";
import validateRequest from "../validators/validateRequest";

const router = Router();
router.post("/chat",authenticateUser, CampaignPlanController.createChat);
router.post("/create", authenticateUser,validateRequest(validateCampaign),CampaignPlanController.createCampaignPlan);
router.get('/:id', authenticateUser,CampaignPlanController.getCampaignPlan);
router.post('/:id/recommendations', authenticateUser, CampaignPlanController.getAiRecommendations);
router.post('/:id/finalize', authenticateUser,CampaignPlanController.finalizeCampaignPlan);
export default router;
