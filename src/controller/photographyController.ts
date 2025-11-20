import { Request, Response } from 'express';
import { photographyClient } from '../services/apiClient';
import { handleApiError, ImageGenerationError, withErrorHandling } from '../utils/errorHandler';
import { JobService } from '../services/jobServices';
import { PhotographyGeneration } from '../models';
import { MulterFiles } from '../utils/multer';
import FormData from 'form-data';
import { json } from 'zod';

export class PhotographyController {
  static async getPresets(req: Request, res: Response) {
    try {
      const presets = await withErrorHandling(async () => {
        return await photographyClient.get('/api/v1/photography/presets');
      }, 'photography_presets');

      res.json({
        success: true,
        data: presets
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async generatePrompt(req: Request, res: Response) {
    try {
      const prompt = await withErrorHandling(async () => {
        return await photographyClient.post('/api/v1/photography/prompts', req.body);
      }, 'photography_prompt');

      res.json({
        success: true,
        data: prompt
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async transformImage(req: Request, res: Response) {
    try {
      const user: any = req.user;
      const userId = user.userId;

      // Check for prompt
      if (!req.body.prompt) {
        throw new ImageGenerationError('Prompt is required', 400);
      }

      const formData: any = new FormData();
      formData.append('prompt', req.body.prompt);

      let fileToSend: Express.Multer.File | null = null;

      if (req.file) {
        fileToSend = req.file;
      } else if (req.files) {
        const files = req.files as any;
        if (files['source_image'] && Array.isArray(files['source_image'])) {
          fileToSend = files['source_image'][0];
        }
        else if (Array.isArray(files) && files.length > 0) {
          fileToSend = files[0];
        }
      }
      if (!fileToSend) {
        throw new ImageGenerationError('Source image is required', 400);
      }
      formData.append('source_image', fileToSend.buffer, {
        filename: fileToSend.originalname,
        contentType: fileToSend.mimetype
      });

      const response = await photographyClient.postFormData('/api/v1/photography/transform', formData);

      const { job } = await JobService.createPhotographyJob(userId, {
        prompt: req.body.prompt,
        productName: req.body.productName,
        photographyType: req.body.photographyType,
        backgroundColor: req.body.backgroundColor,
        sourceImageUrl: req.body.source_image_url,
        job_id: response.job_id,
      });

      res.status(202).json({
        success: true,
        data: {
          job_id: response.job_id,
          status: response.status
        }
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }
  static async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const user: any = req.user;
      const userId = user.userId;
      // console.log('Fetching photography job status for user:', userId, 'jobId:', jobId);
      const result = await withErrorHandling(async () => {
        const job = await JobService.getJob(jobId);
        if (!job || job.userId !== userId) {
          throw new ImageGenerationError('Photography job not found', 404, null, 'photography');
        }

        if (job.status === 'completed' || job.status === 'failed') {
          const photography = await PhotographyGeneration.findOne({ jobId: jobId });

          return {
            job_id: jobId,
            status: job.status,
            result: job.resultData,
            error_message: job.errorMessage,
            photography_data: photography
          };
        }

        const status = await photographyClient.get(`/api/v1/photography/jobs/${jobId}`);

        if (status.status !== job.status) {
          await JobService.updateJob(jobId, {
            status: status.status,
            ...(status.status === 'completed' && { resultData: status.result }),
            ...(status.status === 'failed' && { errorMessage: status.error_message })
          });

          if (status.status === 'completed' && status.result) {
            await PhotographyGeneration.findOneAndUpdate(
              { jobId: jobId },
              {
                transformedImageUrl: status.result.image_url
              },
              { new: true }
            );
          }
        }
        return status;
      }, 'photography');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }
}