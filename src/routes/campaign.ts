import { Router } from "express";
import { CampaignPlanController } from "../controller/campaign";
import CalendarController from "../controller/calendar";
import { authenticateUser } from "../middleware";

const router = Router();

// ============================================
// RECOMMENDATIONS CHAT FLOW
// ============================================

// GET - Get existing recommendations or generate new ones
// GET /api/v1/brands/:brand_id/recommendations/chat
router.get('/:brand_id/recommendations/chat', authenticateUser, CampaignPlanController.getRecommendationsChat);

// POST - Send a message to refine recommendations
// POST /api/v1/brands/:brand_id/recommendations/chat
router.post('/:brand_id/recommendations/chat', authenticateUser, CampaignPlanController.postRecommendationsChat);

// DELETE - Reset recommendations to start fresh
// DELETE /api/v1/brands/:brand_id/recommendations
router.delete('/:brand_id/recommendations', authenticateUser, CampaignPlanController.deleteRecommendations);

// ============================================
// CALENDAR GENERATION
// ============================================

// Generate calendar (creates plan + generates calendar in one call)
// POST /api/v1/brands/:brand_id/generate-calendar
router.post('/:brand_id/generate-calendar', authenticateUser, CalendarController.generateBrandCalendar);

export default router;
