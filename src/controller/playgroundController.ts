import { Request, Response } from 'express';
import { playgroundClient } from '../services/apiClient';
import { handleApiError, ImageGenerationError, withErrorHandling } from '../utils/errorHandler';
import { JobService } from '../services/jobServices';
import { PlaygroundJob, PlaygroundSession } from '../models';
import { MulterFiles } from '../utils/multer';
import FormData from 'form-data';


export class PlaygroundController {
  static async analyzeStyle(req: Request, res: Response) {
    try {
      const user: any = req.user;
      const userId = user.userId;
      const referenceImage =
        Array.isArray(req.files) &&
        req.files.find((f: Express.Multer.File) => f.fieldname === 'reference_image');

      if (!referenceImage) {
        throw new ImageGenerationError('Reference image is required', 400);
      }

      let styleComponents = req.body.style_components;


      let summarizePrompt = req.body.summarize_prompt;


      // ----- Build FormData to call external API -----
      const formData = new FormData();
      formData.append('reference_image', referenceImage.buffer, {
        filename: referenceImage.originalname,
        contentType: referenceImage.mimetype,
      });
      formData.append('style_components', styleComponents);
      formData.append('summarize_prompt', summarizePrompt);
      // console.log('🎨 Sending request to analyze style API', formData);
      const response = await playgroundClient.postFormData(
        '/api/v1/playground/analyze-style',
        formData
      );

      const { job } = await JobService.createPlaygroundJob(userId, 'analysis', {
        styleComponents,
        summarizePrompt,
        referenceImageUrl: '',
        job_id: response.job_id,
      });

      res.status(202).json({
        success: true,
        data: {
          job_id: response.job_id,
          status: response.status || 'pending',
        },
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }



  static async generateImage(req: Request, res: Response) {
    try {

      const user: any = req.user;
      const userId = user.userId;
      const result = await withErrorHandling(async () => {
        const response = await playgroundClient.post('/api/v1/playground/generate', {
          prompt: req.body.prompt,
          quality: req.body.quality || 'medium'
        });
        // console.log('🎨 Playground generation initiated:', response);
        const { job } = await JobService.createPlaygroundJob(userId, 'generation', {
          prompt: req.body.prompt,
          quality: req.body.quality,
          job_id: response?.job_id,
        });

        return {
          job_id: response.job_id
        };
      }, 'playground_generation');

      res.status(202).json({
        success: true,
        data: result
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
      const response = await playgroundClient.postFormData('/api/v1/playground/sessions', formData);

      const session = await JobService.createPlaygroundSession(userId, {
        baseImageUrl: response.initial_image_url,
        sessionId: response.session_id,
      });
      res.status(201).json({
        success: true,
        data: {
          session_id: session.sessionId,
          initial_image_url: session.baseImageUrl
        }
      });
    } catch (error) {
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
      // console.log('🎨 Sending request to playground edit API');
      const response = await playgroundClient.postFormData(
        `/api/v1/playground/sessions/${sessionId}/edits`,
        formData
      );
      // console.log('🎨 Playground edit initiated:', response);
      const { job } = await JobService.createPlaygroundJob(userId, 'editing', {
        sessionId,
        prompt: req.body.prompt,
        job_id: response.job_id,
      });

      res.status(202).json({
        success: true,
        data: {
          job_id: response.job_id,
          session_id: response.session_id
        }
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }


  static async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const user: any = req.user;
      const userId = user.userId;

      const session = await PlaygroundSession.findOne({
        sessionId: sessionId,
        userId: userId
      });

      if (!session) {
        throw new ImageGenerationError('Playground session not found', 404, null, 'playground');
      }

      res.json({
        success: true,
        data: session
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
          throw new ImageGenerationError('Playground job not found', 404, null, 'playground');
        }

        if (job.status === 'completed' || job.status === 'failed') {
          const playgroundJob = await PlaygroundJob.findOne({ jobId: jobId });

          return {
            job_id: jobId,
            status: job.status,
            result: job.resultData,
            error_message: job.errorMessage,
            job_type: playgroundJob?.type
          };
        }

        const status = await playgroundClient.get(`/api/v1/playground/jobs/${jobId}`);

        if (status.status !== job.status) {
          await JobService.updateJob(jobId, {
            status: status.status,
            resultData: status.result,
            ...(status.status === 'failed' && { errorMessage: status.error_message })
          });

          // Update session if this is an editing job and it completed
          if (status.status === 'completed' && status.result?.image_url) {
            const playgroundJob = await PlaygroundJob.findOne({ jobId: jobId });

            if (playgroundJob?.sessionId && playgroundJob.type === 'editing') {
              const session = await PlaygroundSession.findOne({
                sessionId: playgroundJob.sessionId
              });

              if (session) {
                const updatedHistory = [...(session.historyUrls || []), status.result.image_url];

                await PlaygroundSession.findOneAndUpdate(
                  { sessionId: playgroundJob.sessionId },
                  {
                    currentImageUrl: status.result.image_url,
                    historyUrls: updatedHistory,
                    updatedAt: new Date()
                  },
                  { new: true }
                );
              }
            }
          }
        }

        return status;
      }, 'playground');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleApiError(error, res);
    }
  }
}