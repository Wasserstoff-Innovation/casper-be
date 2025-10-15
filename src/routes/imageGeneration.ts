// src/routes/imageGeneration.ts
import { Router } from 'express';

import { handleApiError } from '../utils/errorHandler';
import { JobService } from '../services/jobServices';
import { preprocessFormData, uploadMiddleware } from '../middleware/uploadMiddleware';
import { CarouselController } from '../controller/carouselController';
import { MascotController } from '../controller/mascotController';
import { MemeController } from '../controller/memeController';
import { PlaygroundController } from '../controller/playgroundController';
import { PhotographyController } from '../controller/photographyController';
import { PrintAdController } from '../controller/printAdController';
import { authenticateUser } from '../middleware';
import validateRequest from '../validators/validateRequest';
import { CarouselFramePromptsSchema, CarouselIdeasSchema, JobIdSchema, MascotGenerateSchema, MascotPromptsSchema, MemeGenerateSchema, PhotographyPromptSchema, PhotographyTransformSchema, PlaygroundAnalyzeSchema, PlaygroundEditSchema, PlaygroundGenerateSchema, PrintAdGenerateSchema, SessionIdSchema } from '../validators';

const   router = Router();

// Carousel routes
router.post('/carousel/ideas', authenticateUser, validateRequest(CarouselIdeasSchema), CarouselController.generateIdeas);
router.post('/carousel/frame-prompts', authenticateUser, CarouselController.generateFramePrompts);
router.post('/carousel/generate-visuals', authenticateUser, uploadMiddleware, CarouselController.generateVisuals);
router.get('/carousel/jobs/:jobId', authenticateUser,  validateRequest(JobIdSchema), CarouselController.getJobStatus);

// Mascot routes
router.post('/mascot/prompts', authenticateUser,  validateRequest(MascotPromptsSchema), MascotController.generatePrompts);
router.post('/mascot/generate', authenticateUser,   validateRequest(MascotGenerateSchema),MascotController.generateImage);
router.post('/mascot/sessions', authenticateUser, uploadMiddleware, MascotController.createSession);
router.post('/mascot/sessions/:sessionId/edits', authenticateUser, uploadMiddleware, validateRequest(PlaygroundEditSchema),MascotController.applyEdit);
router.get('/mascot/jobs/:jobId', authenticateUser,  validateRequest(JobIdSchema), MascotController.getJobStatus);

// Meme routes
router.post('/memes/generate', authenticateUser ,uploadMiddleware,  validateRequest(MemeGenerateSchema), MemeController.generateMeme);
router.get('/memes/jobs/:jobId', authenticateUser,   validateRequest(JobIdSchema), MemeController.getJobStatus);
router.get('/memes/history', authenticateUser, MemeController.getUserMemes);

// Playground routes
router.post('/playground/analyze-style', authenticateUser, uploadMiddleware,validateRequest(PlaygroundAnalyzeSchema), PlaygroundController.analyzeStyle);
router.post('/playground/generate', authenticateUser,   validateRequest(PlaygroundGenerateSchema),PlaygroundController.generateImage);
router.post('/playground/sessions', authenticateUser, uploadMiddleware, PlaygroundController.createSession);
router.post('/playground/sessions/:sessionId/edits', authenticateUser,  uploadMiddleware, validateRequest(PlaygroundEditSchema), PlaygroundController.applyEdit);
router.get('/playground/sessions/:sessionId', authenticateUser,  validateRequest(SessionIdSchema), PlaygroundController.getSession);
router.get('/playground/jobs/:jobId', authenticateUser,   validateRequest(JobIdSchema),PlaygroundController.getJobStatus);

// Photography routes
router.get('/photography/presets', authenticateUser,PhotographyController.getPresets);
router.post('/photography/prompts', authenticateUser,     validateRequest(PhotographyPromptSchema),PhotographyController.generatePrompt);
router.post('/photography/transform', authenticateUser,  uploadMiddleware,validateRequest(PhotographyTransformSchema), PhotographyController.transformImage);
router.get('/photography/jobs/:jobId', authenticateUser,     validateRequest(JobIdSchema), PhotographyController.getJobStatus);

// Print Ad routes
router.post('/print-ads/generate', authenticateUser,    validateRequest(PrintAdGenerateSchema),uploadMiddleware, PrintAdController.generateAd);
router.get('/print-ads/jobs/:jobId', authenticateUser,  validateRequest(JobIdSchema), PrintAdController.getJobStatus);

// Global job management
router.get('/jobs', authenticateUser, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { feature_type, limit, offset } = req.query;
    
    const jobs = await JobService.getUserJobs(
      userId, 
      feature_type as string, 
      Number(limit) || 50
    );

    res.json({
      success: true,
      data: jobs,
      pagination: {
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        total: jobs.length
      }
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

export default router;