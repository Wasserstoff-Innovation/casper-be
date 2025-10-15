import { Request, Response } from 'express';
import { carouselClient } from '../services/apiClient';
import { handleApiError, ImageGenerationError } from '../utils/errorHandler';
import { JobService } from '../services/jobServices';
import { carouselGenerations } from '../model/schema';
import db from '../config/db';
import { eq } from 'drizzle-orm';

export class CarouselController {
  static async generateIdeas(req: Request, res: Response) {
    try {
      const ideas = await carouselClient.post('/api/v1/content/ideas', req.body);
      res.json({
        success: true,
        data: (ideas) 
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async generateFramePrompts(req: Request, res: Response) {
    try {
      // console.log('Generating frame prompts with payload inside"')
      const prompts = await carouselClient.post('/api/v1/content/frame-prompts', req.body);
      // console.log('Generated frame prompts:', prompts);
      res.json({
        success: true,
        data:(prompts)
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async generateVisuals(req: Request, res: Response) {
    try {
      // console.log('🎨 Received request to generate visuals');

      const user: any = req.user;
      const userId = user?.userId;
      const formData: any = new FormData();
      // ✅ Append text fields exactly as required by the external API
      if (req.body.frame_prompts) {
        formData.append('frame_prompts', req.body.frame_prompts);
      }

      if (req.body.brand_guidelines) {
        formData.append('brand_guidelines', req.body.brand_guidelines);
      }

      if (req.body.generate_images !== undefined) {
        formData.append('generate_images', req.body.generate_images);
      }

      // ✅ Append files (mascot_file, logo_file, product_file)
      if (req.files) {
        const files = req.files as Record<string, Express.Multer.File[]>;
        Object.entries(files).forEach(([key, fileArray]) => {
          const file = fileArray[0];
          if (file) {
            formData.append(key, file.buffer as any, {
              filename: file.originalname,
              contentType: file.mimetype,
            });
          }
        });
      }

      // console.log('🧾 Submitting to Carousel API with fields:', Array.from(formData.keys()));

      // ✅ Submit to external Carousel API
      const response = await carouselClient.postFormData('/api/v1/visuals/generate', formData);

      // console.log('✅ Carousel API Response:', response);

      // ✅ Create job record in your own DB
      const job = await JobService.createJob(userId, 'carousel', {
        framePrompts: req.body.frame_prompts,
        brandGuidelines: req.body.brand_guidelines,
        generateImages: req.body.generate_images,
        job_id: response.job_id,
      });

      // ✅ Store generation record for tracking
      await db.insert(carouselGenerations).values({
        userId,
        jobId: job.jobId, // ✅ use local jobId, not external API job_id
        framePrompts: JSON.parse(req.body.frame_prompts),
        brandGuidelines: JSON.parse(req.body.brand_guidelines),
        contentIdeas: null,
        enhancedPrompts: null,
        imageUrls: null,
        productCategory: null,
        targetAudience: null
      });

      // ✅ Return success response
      return res.status(202).json({
        success: true,
        data: {
          job_id: response.job_id,
          status: response.status,
        },
      });
    } catch (error) {
      console.error('❌ Error generating visuals:', error);
      handleApiError(error, res);
    }
  }


  static async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const user: any = req.user
      const userId = user.userId;

      // Verify job belongs to user
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

      // Poll external API for status
      const status = await carouselClient.get(`/api/v1/visuals/jobs/${jobId}`);
      // console.log('🔄 Polled Carousel API status:', status);
      // Update our job record if status changed
      if (status.status !== job.status) {
        await JobService.updateJob(jobId, {
          status: status.status,
          ...(status.status === 'completed' && { resultData: status.result }),
          ...(status.status === 'failed' && { errorMessage: status.error_message })
        });

        // Update carousel generation if completed
        if (status.status === 'completed' && status.result) {
          await db.update(carouselGenerations)
            .set({
              enhancedPrompts: status.result.enhanced_prompts,
              imageUrls: status.result.image_urls
            })
            .where(eq(carouselGenerations.jobId, jobId));
        }
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }
}