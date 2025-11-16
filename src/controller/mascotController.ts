import { Request, Response } from 'express';
import { mascotClient } from '../services/apiClient';
import { handleApiError, ImageGenerationError } from '../utils/errorHandler';
import { eq } from 'drizzle-orm';
import { JobService } from '../services/jobServices';
import db from '../config/db';
import { mascotGenerations } from '../model/schema';
import FormData from 'form-data';
import { MulterFiles } from '../utils/multer';
import { BrandIdentifier } from '../services/brandIdentifier';
import { BrandDataExtractor } from '../services/brandDataExtractor';

export class MascotController {
  static async generatePrompts(req: Request, res: Response) {
    try {
      const user: any = req.user;
      const userId = user?.userId;
      const brandProfileId = req.body.brand_profile_id || req.query.brand_profile_id;
      
      // If brand_profile_id provided, enhance request with brand context
      if (brandProfileId) {
        const validBrandId = await BrandIdentifier.validateBrand(userId, brandProfileId);
        if (validBrandId) {
          try {
            const guidelines = await BrandDataExtractor.extractBrandGuidelines(validBrandId);
            // Add brand context to prompt generation (if not already provided)
            if (!req.body.brand_context) {
              req.body.brand_context = {
                colors: guidelines.visual_identity.primary_color_hex,
                personality: guidelines.tone_voice.brand_personality,
                audience: guidelines.brand_basics.target_audience,
              };
            }
          } catch (error: any) {
            console.warn('⚠️ Failed to fetch brand data for prompts:', error.message);
            // Continue without brand context
          }
        }
      }
      
      const prompts = await mascotClient.post('/api/v1/mascot/prompts', req.body);

      res.json({
        success: true,
        data: prompts
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async generateImage(req: Request, res: Response) {
    try {
      const user: any = req.user
      const userId = user.userId;
      // console.log('🎨 Received request to generate mascot image:', user,userId);
      const payload = req.body;
      if (!payload.prompt) {
        throw new ImageGenerationError('Prompt is required', 400);
      }
      const response = await mascotClient.post('/api/v1/mascot/generate', payload);
      // console.log('🎨 Mascot generation initiated:', response);
      if (response.job_id) {
        payload['job_id'] = response.job_id;
      }
      const job = await JobService.createJob(userId, 'mascot', payload);

      await db.insert(mascotGenerations).values({
        userId,
        jobId: response.job_id,
        selectedPrompt: req.body.prompt
      });

      res.status(202).json({
        success: true,
        data: {
          job_id: response.job_id
        }
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async createSession(req: Request, res: Response) {
    try {
      const user: any = req.user;
      const userId = user.userId;

      const formData = new FormData();
      let files: Express.Multer.File[] = [];
      if (Array.isArray(req.files)) {
        files = req.files;
      } else if (req.files && typeof req.files === 'object') {
        files = Object.values(req.files).flat();
      }
      const baseImage = files.find((f) => f.fieldname === 'base_image');

      if (baseImage) {
        formData.append('base_image', baseImage.buffer, {
          filename: baseImage.originalname,
          contentType: baseImage.mimetype,
        });
      } else if (req.body.base_image) {
        formData.append('base_image', req.body.base_image);
      } else {
        return res.status(400).json({
          success: false,
          message: 'base_image is required (either upload or string)',
        });
      }
      const response = await mascotClient.postFormData('/api/v1/mascot/sessions', formData);

      await db.insert(mascotGenerations).values({
        userId,
        sessionId: response.session_id,
        finalImageUrl: response.initial_image_url,
        editHistory: [{
          type: 'initial',
          image_url: response.initial_image_url,
          timestamp: new Date(),
        }],
      });

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('❌ Error in createSession:', error);
      handleApiError(error, res);
    }
  }

  static async applyEdit(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const user: any = req.user;
      const userId = user.userId;
      if (!req.body.prompt) {
        throw new ImageGenerationError('Prompt is required', 400);
      }

      const formData = new FormData();
      formData.append('prompt', req.body.prompt);

      // FIX: Type-safe file access
      if (req.files) {
        const files = req.files as MulterFiles;
        const componentImages = files['component_images'];

        if (componentImages && Array.isArray(componentImages)) {
          componentImages.forEach(file => {
            formData.append('component_images', file.buffer, file.originalname);
          });
        }
      }
      const response = await mascotClient.postFormData(
        `/api/v1/mascot/sessions/${sessionId}/edits`,
        formData
      );
      console.log('🎨 Mascot edit applied:', response);
      const job = await JobService.createJob(userId, 'mascot_edit', response);
      const updateMoscatJobId = await db.update(mascotGenerations)
        .set({ jobId: job.jobId })
        .where(eq(mascotGenerations.sessionId, sessionId));
      res.status(202).json({
        success: true,
        data: response
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const user = req.user as any;
      const userId = user.userId;

      const job = await JobService.getJob(jobId);
      if (!job || job.userId !== userId) {
        throw new ImageGenerationError('Job not found', 404);
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return res.json({
          success: true,
          data: {
            job_id: jobId,
            status: job.status,
            result: job.resultData,
            error_message: job.errorMessage
          }
        });
      }

      const status = await mascotClient.get(`/api/v1/mascot/jobs/${jobId}`);

      if (status.status !== job.status) {
        await JobService.updateJob(jobId, {
          status: status.status,
          ...(status.status === 'completed' && { resultData: status.result })
        });

        if (status.status === 'completed' && status.result) {
          await db.update(mascotGenerations)
            .set({ finalImageUrl: status.result.image_url })
            .where(eq(mascotGenerations.jobId, jobId));
        }
      }
      res.json({success: true,data: status});
    } catch (error) {
      handleApiError(error, res);
    }
  }
}