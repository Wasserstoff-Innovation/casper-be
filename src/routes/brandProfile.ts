import express from 'express';
import multer from 'multer';
import BrandProfileController from '../controller/brandProfile';
import { authenticateUser } from '../middleware';


const router = express.Router();
export const upload = multer();
// POST /jobs - Create brand intelligence analysis job
// v2 API: Expects JSON body with { url, include_screenshots?, include_web_search?, max_pages? }
// Legacy: Also supports multipart/form-data with file upload (file upload not used in v2)
router.post('/jobs', authenticateUser, upload.single('file'), BrandProfileController.createJob);
// GET /jobs - Get job history for user (MUST come before /jobs/:job_id)
router.get('/jobs', authenticateUser, BrandProfileController.getJobHistory);
// GET /jobs/:job_id - Check job status
router.get('/jobs/:job_id', authenticateUser, BrandProfileController.getJobStatus);
// GET /jobs/:job_id/details - Get detailed job information
router.get('/jobs/:job_id/details', authenticateUser, BrandProfileController.getJobDetailsById);
// POST /re-analyze - Re-analyze existing job and create/update brand kit
router.post('/re-analyze', authenticateUser, BrandProfileController.reAnalyzeBrandKit);
// GET /personas - List available personas (Wisdom Tree)
router.get('/personas', authenticateUser, BrandProfileController.listPersonas);

// NEW: Brand Intelligence View Models
// GET /profiles - List all profiles for user with filtering (must come before /profiles/:id)
router.get('/profiles', authenticateUser, BrandProfileController.listProfiles);
// GET /profiles/:id/summary - Get lightweight summary view for drawer
router.get('/profiles/:id/summary', authenticateUser, BrandProfileController.getSummaryView);
// GET /profiles/:id/detail - Get full detail view for deep dive
router.get('/profiles/:id/detail', authenticateUser, BrandProfileController.getDetailView);

// NEW: Update profile and brand kit fields
// PATCH /profiles/:id - Update brand profile fields (name, logo_url, colors, etc.)
router.patch('/profiles/:id', authenticateUser, BrandProfileController.updateProfile);
// PATCH /profiles/:id/brand-kit - Update brand kit fields (visual_identity, verbal_identity, etc.)
router.patch('/profiles/:id/brand-kit', authenticateUser, BrandProfileController.updateBrandKit);
// PATCH /profiles/:id/social/:platform - Update social profile for a platform
router.patch('/profiles/:id/social/:platform', authenticateUser, BrandProfileController.updateSocialProfile);

// NEW: Roadmap Task Management
// PATCH /roadmap/tasks/bulk - Bulk update multiple tasks
router.patch('/roadmap/tasks/bulk', authenticateUser, BrandProfileController.bulkUpdateTasks);
// PATCH /roadmap/tasks/:task_id - Update single task status
router.patch('/roadmap/tasks/:task_id', authenticateUser, BrandProfileController.updateTask);

// NEW: Module-Specific Re-Analysis
// POST /profiles/:id/analyze/module - Generic module analysis (accepts module in body)
router.post('/profiles/:id/analyze/module', authenticateUser, BrandProfileController.analyzeModule);

// Quick-action module analysis endpoints
router.post('/profiles/:id/analyze/visual-identity', authenticateUser, BrandProfileController.analyzeVisualIdentity);
router.post('/profiles/:id/analyze/seo', authenticateUser, BrandProfileController.analyzeSEO);
router.post('/profiles/:id/analyze/trust-elements', authenticateUser, BrandProfileController.analyzeTrustElements);
router.post('/profiles/:id/analyze/audience', authenticateUser, BrandProfileController.analyzeAudience);
router.post('/profiles/:id/analyze/messaging', authenticateUser, BrandProfileController.analyzeMessaging);
router.post('/profiles/:id/analyze/content', authenticateUser, BrandProfileController.analyzeContent);
router.post('/profiles/:id/analyze/pricing', authenticateUser, BrandProfileController.analyzePricing);
router.post('/profiles/:id/analyze/social', authenticateUser, BrandProfileController.analyzeSocial);

// GET /:profile_id - Get brand profile (OPTIMIZED: now returns BrandIntelligenceView)
router.get('/:profile_id', authenticateUser, BrandProfileController.getProfile);

export default router;
