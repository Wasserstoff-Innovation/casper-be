import { Request, Response } from 'express';
import { memeClient } from '../services/apiClient';
import { handleApiError, ImageGenerationError, withErrorHandling } from '../utils/errorHandler';
import { desc, eq } from 'drizzle-orm';
import { JobService } from '../services/jobServices';
import db from '../config/db';
import { memeGenerations } from '../model/schema';
import { MulterFiles } from '../utils/multer';

export class MemeController {
  static async generateMeme(req: Request, res: Response) {
    try {
      const user: any = req.user;
      const userId = user.userId;

      if (!req.body.text) {
        throw new ImageGenerationError('Text is required', 400);
      }

      // Use native FormData (built into Node.js 18+)
      const formData = new FormData();

      formData.append('text', req.body.text);
      formData.append('art_style', req.body.artStyle);

      if (req.body.logoDesc) formData.append('logo_desc', req.body.logoDesc);
      if (req.body.mascotDesc) formData.append('mascot_desc', req.body.mascotDesc);
      if (req.body.productDesc) formData.append('product_desc', req.body.productDesc);

      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const logoFile = files['logo_file'];
        const mascotFile = files['mascot_file'];
        const productFile = files['product_file'];

        if (logoFile && logoFile[0]) {
          // Create Blob from buffer for native FormData
          const blob = new Blob([logoFile[0].buffer], { type: logoFile[0].mimetype });
          formData.append('logo_file', blob, logoFile[0].originalname);
        }

        if (mascotFile && mascotFile[0]) {
          const blob = new Blob([mascotFile[0].buffer], { type: mascotFile[0].mimetype });
          formData.append('mascot_file', blob, mascotFile[0].originalname);
        }

        if (productFile && productFile[0]) {
          const blob = new Blob([productFile[0].buffer], { type: productFile[0].mimetype });
          formData.append('product_file', blob, productFile[0].originalname);
        }
      }

      const response = await memeClient.postFormData('/api/v1/memes/generate', formData);
      // console.log('🎨 Meme generation initiated:', response);
      const { job, meme } = await JobService.createMemeJob(userId, {
        text: req.body.text,
        artStyle: req.body.artStyle,
        logoDesc: req.body.logoDesc,
        mascotDesc: req.body.mascotDesc,
        productDesc: req.body.productDesc,
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

      const result = await withErrorHandling(async () => {
        const job = await JobService.getJob(jobId);
        if (!job || job.userId !== userId) {
          throw new ImageGenerationError('Meme generation job not found', 404, null, 'meme');
        }

        if (job.status === 'completed' || job.status === 'failed') {
          const [meme] = await db.select()
            .from(memeGenerations)
            .where(eq(memeGenerations.jobId, jobId));

          return {
            job_id: jobId,
            status: job.status,
            result: job.resultData,
            error_message: job.errorMessage,
            meme_data: meme
          };
        }

        const status = await memeClient.get(`/api/v1/memes/jobs/${jobId}`);

        if (status.status !== job.status) {
          await JobService.updateJob(jobId, {
            status: status.status,
            ...(status.status === 'completed' && { resultData: status.result }),
            ...(status.status === 'failed' && { errorMessage: status.error_message })
          });

          if (status.status === 'completed' && status.result) {
            await db.update(memeGenerations)
              .set({
                imageUrl: status.result.image_url,
                memeConcept: status.result.meme_concept,
                humorStyle: status.result.humor_style,
                templateUsed: status.result.template_used
              })
              .where(eq(memeGenerations.jobId, jobId));
          }
        }

        return status;
      }, 'meme');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }

  static async getUserMemes(req: Request, res: Response) {
    try {
      const user: any = req.user;
      const userId = user.userId;
      const { limit = 20, offset = 0 } = req.query;

      const memes = await db.select()
        .from(memeGenerations)
        .where(eq(memeGenerations.userId, userId))
        .orderBy(desc(memeGenerations.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json({
        success: true,
        data: memes,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: memes.length
        }
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }
}