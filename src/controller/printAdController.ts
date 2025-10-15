import { Request, Response } from 'express';
import { printAdClient } from '../services/apiClient';
import { handleApiError, ImageGenerationError, withErrorHandling } from '../utils/errorHandler';
import { eq } from 'drizzle-orm';
import { JobService } from '../services/jobServices';
import db from '../config/db';
import { printAdGenerations } from '../model/schema';
import { MulterFiles } from '../utils/multer';
import FormData from 'form-data';

export class PrintAdController {
  static async generateAd(req: Request, res: Response) {
    try {
      const user: any = req.user;
      const userId = user.userId;
      if (!req.body.campaign_data) {
        throw new ImageGenerationError('Campaign data is required', 400);
      }
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new ImageGenerationError('Files are required', 400);
      }
      const formData = new FormData();
      formData.append('campaign_data', (req.body.campaign_data));
      const filesArray = req.files as Express.Multer.File[];
      if (filesArray.length < 1) {
        throw new ImageGenerationError('Brand guidelines file is required', 400);
      }
      // console.log('Appending brand_guidelines_file:', filesArray[0].originalname);
      formData.append('brand_guidelines_file', filesArray[0].buffer, {
        filename: filesArray[0].originalname,
        contentType: filesArray[0].mimetype
      });

      if (filesArray.length > 1) {
        // console.log('Appending logo_file:', filesArray[1].originalname);
        formData.append('logo_file', filesArray[1].buffer, {
          filename: filesArray[1].originalname,
          contentType: filesArray[1].mimetype
        });
      }

      if (filesArray.length > 2) {
        // console.log('Appending mascot_file:', filesArray[2].originalname);
        formData.append('mascot_file', filesArray[2].buffer, {
          filename: filesArray[2].originalname,
          contentType: filesArray[2].mimetype
        });
      }

      if (filesArray.length > 3) {
        // console.log('Appending product_file:', filesArray[3].originalname);
        formData.append('product_file', filesArray[3].buffer, {
          filename: filesArray[3].originalname,
          contentType: filesArray[3].mimetype
        });
      }
      // console.log('FormData prepared with', filesArray.length, 'files');
      const response = await printAdClient.postFormData('/api/v1/print-ads/generate', formData);
      const { job } = await JobService.createPrintAdJob(userId, {
        campaignData: req.body.campaign_data,
        brandGuidelines: req.body.brand_guidelines,
        job_id: response.job_id
      });
      res.status(202).json({
        success: true,
        data: {
          job_id: response.job_id,
          status: response.status
        }
      });
    } catch (error) {
      console.error('GenerateAd error details:', error);
      handleApiError(error, res);
    }
  }

  static async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const user: any = req.user;
      const userId = user.userId;

      const result = await withErrorHandling(async () => {
        const job = await JobService.getJob(jobId);
        if (!job || job.userId !== userId) {
          throw new ImageGenerationError('Print ad job not found', 404, null, 'print_ad');
        }

        if (job.status === 'completed' || job.status === 'failed') {
          const [printAd] = await db.select()
            .from(printAdGenerations)
            .where(eq(printAdGenerations.jobId, jobId));

          return {
            job_id: jobId,
            status: job.status,
            result: job.resultData,
            error_message: job.errorMessage,
            print_ad_data: printAd
          };
        }
        const status = await printAdClient.get(`/api/v1/print-ads/jobs/${jobId}`);
        if (status.status !== job.status) {
          await JobService.updateJob(jobId, {
            status: status.status,
            ...(status.status === 'completed' && { resultData: status.result }),
            ...(status.status === 'failed' && { errorMessage: status.error_message })
          });

          if (status.status === 'completed' && status.result) {
            await db.update(printAdGenerations)
              .set({
                aiOptimizedImageUrl: status.result.ai_optimized_image_url,
                userInstructedImageUrl: status.result.user_instructed_image_url,
                aiOptimizedPrompt: status.result.ai_optimized_prompt,
                userInstructedPrompt: status.result.user_instructed_prompt
              })
              .where(eq(printAdGenerations.jobId, jobId));
          }
        }

        return status;
      }, 'print_ad');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }
}