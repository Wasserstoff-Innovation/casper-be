import { Router } from "express";
import { CampaignController } from "../controller/campaign";
import CalendarController from "../controller/calendar";
import { authenticateUser } from "../middleware";

const router = Router();

// ============================================
// RECOMMENDATIONS CHAT FLOW
// ============================================

// GET - Get existing recommendations or generate new ones
router.get('/:brand_id/recommendations/chat', authenticateUser, CampaignController.getRecommendationsChat);

// POST - Send a message to refine recommendations
router.post('/:brand_id/recommendations/chat', authenticateUser, CampaignController.postRecommendationsChat);

// DELETE - Reset recommendations to start fresh
router.delete('/:brand_id/recommendations', authenticateUser, CampaignController.deleteRecommendations);

// ============================================
// CAMPAIGN CRUD
// ============================================

// POST - Create campaign from recommendations
router.post('/:brand_id/campaigns', authenticateUser, CampaignController.createCampaign);

// GET - List all campaigns for a brand
router.get('/:brand_id/campaigns', authenticateUser, CampaignController.getCampaigns);

// GET - Get specific campaign
router.get('/:brand_id/campaigns/:campaign_id', authenticateUser, CampaignController.getCampaign);

// PUT - Update campaign status
router.put('/:brand_id/campaigns/:campaign_id/status', authenticateUser, CampaignController.updateCampaignStatus);

// DELETE - Delete campaign
router.delete('/:brand_id/campaigns/:campaign_id', authenticateUser, CampaignController.deleteCampaign);

// ============================================
// CAMPAIGN CALENDAR GENERATION
// ============================================

// POST - Generate calendar for campaign
router.post('/:brand_id/campaigns/:campaign_id/generate-calendar', authenticateUser, CalendarController.generateCampaignCalendar);

// GET - Get calendar generation status
router.get('/:brand_id/campaigns/:campaign_id/calendar-status', authenticateUser, CalendarController.getCampaignCalendarStatus);

// ============================================
// CALENDAR POSTS (under campaign)
// ============================================

// GET - Get all posts for a campaign
router.get('/:brand_id/campaigns/:campaign_id/posts', authenticateUser, CalendarController.getCampaignPosts);

// GET - Get post stats for a campaign
router.get('/:brand_id/campaigns/:campaign_id/posts/stats', authenticateUser, CalendarController.getCampaignPostStats);

// ============================================
// BRAND CALENDAR (aggregated view)
// ============================================

// GET - Get full calendar for brand (all campaigns)
router.get('/:brand_id/calendar', authenticateUser, CalendarController.getBrandCalendar);

// ============================================
// BRAND RESOURCES
// ============================================

// POST - Create resource
router.post('/:brand_id/resources', authenticateUser, CampaignController.createResource);

// GET - List all resources for brand
router.get('/:brand_id/resources', authenticateUser, CampaignController.getResources);

// GET - Get filled variables
router.get('/:brand_id/resources/filled-variables', authenticateUser, CampaignController.getFilledVariables);

// GET - Get resource by variable name
router.get('/:brand_id/resources/by-variable/:variable_name', authenticateUser, CampaignController.getResourceByVariable);

// GET - Get specific resource
router.get('/:brand_id/resources/:resource_id', authenticateUser, CampaignController.getResource);

// PUT - Update resource
router.put('/:brand_id/resources/:resource_id', authenticateUser, CampaignController.updateResource);

// DELETE - Delete resource
router.delete('/:brand_id/resources/:resource_id', authenticateUser, CampaignController.deleteResource);

export default router;
