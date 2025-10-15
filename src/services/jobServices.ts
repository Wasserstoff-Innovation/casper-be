import { 
  imageGenerationJobs, 
  carouselGenerations, 
  mascotGenerations, 
  memeGenerations,
  playgroundSessions,
  playgroundJobs,
  photographyGenerations,
  printAdGenerations
} from '../model/schema';
import { eq, and, desc } from 'drizzle-orm';
import db from '../config/db';
export class JobService {
 static async createJob(userId: number, featureType: string, inputData: any) {
 try {
  //  console.log('Creating job with inputData: inside ');
  const jobId = inputData?.job_id;
  // console.log("details correctly coming..", userId, featureType, inputData, jobId);
  const json = {data:"data"}
 const [job] = await db.insert(imageGenerationJobs).values({
  userId,
  jobId,
  featureType,
  status: 'queued',
  inputData: inputData,
 
}).returning();

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
    const [job] = await db.update(imageGenerationJobs)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(imageGenerationJobs.jobId, jobId))
      .returning();

    return job;
  }

  static async getJob(jobId: string) {
    const [job] = await db.select()
      .from(imageGenerationJobs)
      .where(eq(imageGenerationJobs.jobId, jobId));

    return job;
  }

  static async getUserJobs(userId: number, featureType?: string, limit: number = 50) {
    const whereClause = featureType 
      ? and(eq(imageGenerationJobs.userId, userId), eq(imageGenerationJobs.featureType, featureType))
      : eq(imageGenerationJobs.userId, userId);

    return await db.select()
      .from(imageGenerationJobs)
      .where(whereClause)
      .orderBy(desc(imageGenerationJobs.createdAt))
      .limit(limit);
  }

  static async createCarouselJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'carousel', data);
    
    const [carousel] = await db.insert(carouselGenerations).values({
      userId,
      jobId: job.jobId,
      productCategory: data.productCategory,
      targetAudience: data.targetAudience,
      ...data
    }).returning();

    return { job, carousel };
  }

  static async createMascotJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'mascot', data);
    
    const [mascot] = await db.insert(mascotGenerations).values({
      userId,
      jobId: job.jobId,
      brandDescription: data.brandDescription,
      visualStyle: data.visualStyle,
      ...data
    }).returning();

    return { job, mascot };
  }

  // Meme specific methods
  static async createMemeJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'meme', data);
    
    const [meme] = await db.insert(memeGenerations).values({
      userId,
      jobId: job.jobId,
      text: data.text,
      artStyle: data.artStyle,
      ...data
    }).returning();

    return { job, meme };
  }

  // Photography specific methods
  static async createPhotographyJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'photography', data);
    
    const [photography] = await db.insert(photographyGenerations).values({
      userId,
      jobId: job.jobId,
      productName: data.productName,
      photographyType: data.photographyType,
      backgroundColor: data.backgroundColor,
      ...data
    }).returning();

    return { job, photography };
  }

  static async createPrintAdJob(userId: number, data: any) {
    const job = await this.createJob(userId, 'print_ad', data);
    
    const [printAd] = await db.insert(printAdGenerations).values({
      userId,
      jobId: job.jobId,
      campaignData: data.campaignData,
      brandGuidelines: data.brandGuidelines,
      ...data
    }).returning();

    return { job, printAd };
  }

  static async createPlaygroundSession(userId: number, sessionData: any) {
    const sessionId = sessionData?.sessionId 
    console.log("details correctly coming..", userId, sessionData, sessionId);
    
    const [session] = await db.insert(playgroundSessions).values({
      userId,
      sessionId,
      baseImageUrl: sessionData.baseImageUrl,
      currentImageUrl: sessionData.baseImageUrl,
      historyUrls: [sessionData.baseImageUrl]
    }).returning();

    return session;
  }

  static async createPlaygroundJob(userId: number, type: string, data: any) {
    const job = await this.createJob(userId, 'playground', data);
    
    const [playgroundJob] = await db.insert(playgroundJobs).values({
      userId,
      jobId: job.jobId,
      type,
      sessionId: data?.sessionId,
      prompt: data.prompt,
      ...data
    }).returning();

    return { job, playgroundJob };
  }
}