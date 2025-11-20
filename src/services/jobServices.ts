import {
  ImageGenerationJob,
  CarouselGeneration,
  MascotGeneration,
  MemeGeneration,
  PlaygroundSession,
  PlaygroundJob,
  PhotographyGeneration,
  PrintAdGeneration
} from '../models';
import { toObjectId } from '../utils/mongoHelpers';

export class JobService {
 static async createJob(userId: number, featureType: string, inputData: any) {
 try {
  const jobId = inputData?.job_id;

  const job = await ImageGenerationJob.create({
    userId: toObjectId(userId),
    jobId,
    featureType,
    status: 'queued',
    inputData: inputData,
  });

  return job;

 } catch (error) {
  console.error('Error creating job:', error);
  throw error;
 }
}


  static async updateJob(jobId: string, updates: {
    status?: string;
    resultData?: any;
    errorMessage?: string;
  }) {
    const job = await ImageGenerationJob.findOneAndUpdate(
      { jobId: jobId },
      {
        ...updates,
        updatedAt: new Date()
      },
      { new: true }
    );

    return job;
  }

  static async getJob(jobId: string) {
    const job = await ImageGenerationJob.findOne({ jobId: jobId }).lean();
    return job;
  }

  static async getUserJobs(userId: number, featureType?: string, limit: number = 50) {
    const query: any = { userId: toObjectId(userId) };
    if (featureType) {
      query.featureType = featureType;
    }

    return await ImageGenerationJob.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async createCarouselJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'carousel', data);

    const carousel = await CarouselGeneration.create({
      userId: toObjectId(userId),
      jobId: job.jobId,
      productCategory: data.productCategory,
      targetAudience: data.targetAudience,
      ...data
    });

    return { job, carousel };
  }

  static async createMascotJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'mascot', data);

    const mascot = await MascotGeneration.create({
      userId: toObjectId(userId),
      jobId: job.jobId,
      brandDescription: data.brandDescription,
      visualStyle: data.visualStyle,
      ...data
    });

    return { job, mascot };
  }

  // Meme specific methods
  static async createMemeJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'meme', data);

    const meme = await MemeGeneration.create({
      userId: toObjectId(userId),
      jobId: job.jobId,
      text: data.text,
      artStyle: data.artStyle,
      ...data
    });

    return { job, meme };
  }

  // Photography specific methods
  static async createPhotographyJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'photography', data);

    const photography = await PhotographyGeneration.create({
      userId: toObjectId(userId),
      jobId: job.jobId,
      productName: data.productName,
      photographyType: data.photographyType,
      backgroundColor: data.backgroundColor,
      ...data
    });

    return { job, photography };
  }

  static async createPrintAdJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'print_ad', data);

    const printAd = await PrintAdGeneration.create({
      userId: toObjectId(userId),
      jobId: job.jobId,
      campaignData: data.campaignData,
      brandGuidelines: data.brandGuidelines,
      ...data
    });

    return { job, printAd };
  }

  static async createPlaygroundSession(userId: number, sessionData: any) {
    const sessionId = sessionData?.sessionId;
    console.log("details correctly coming..", userId, sessionData, sessionId);

    const session = await PlaygroundSession.create({
      userId: toObjectId(userId),
      sessionId,
      baseImageUrl: sessionData.baseImageUrl,
      currentImageUrl: sessionData.baseImageUrl,
      historyUrls: [sessionData.baseImageUrl]
    });

    return session;
  }

  static async createPlaygroundJob(userId: number, type: string, data: any) {
    const job = await this.createJob(userId, 'playground', data);

    const playgroundJob = await PlaygroundJob.create({
      userId: toObjectId(userId),
      jobId: job.jobId,
      type,
      sessionId: data?.sessionId,
      prompt: data.prompt,
      ...data
    });

    return { job, playgroundJob };
  }
}