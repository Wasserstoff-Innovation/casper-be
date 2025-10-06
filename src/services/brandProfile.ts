import axios from "axios";
import FormData from "form-data";
import db from "../config/db";
import { brandProfiles } from "../model/schema";
import { eq } from "drizzle-orm";
import { envConfigs } from "../config/envConfig";


const API_BASE_URL = `${envConfigs.aiBackendUrl}/brand-profiles`;
interface CreateJobInput {
  userId: number;
  source_type: string;
  website?: string | null;
  file?: Buffer | null;
}
export default class BrandProfileService {

 static createBrandProfileJob = async (input: CreateJobInput) => {
  try {
    const formData = new FormData();
    formData.append('source_type', input.source_type);
    if (input.website) formData.append('url', input.website);
    if (input.file) formData.append('csv', input.file, 'file.txt'); 
    // console.log("formdata..", input.website);
    const response = await axios.post(`${API_BASE_URL}/jobs`, formData, {
      headers: formData.getHeaders(),
    });

    const { job_id, status } = response.data;
    // console.log("job_id and status",job_id,status);
    // Save job_id and status in DB
    const inserted = await db.insert(brandProfiles).values({
      userId: input.userId,
      jobId: job_id,
      profileId: null, // will update later
      data: { status, job_id },
    }).returning();

    return inserted[0];
  } catch (error: any) {
    console.error('Error creating Brand Profile Job:', error.response?.data || error.message);
    throw error;
  }
};

// Get Job Status
static getBrandProfileJobStatus = async (jobId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
    // console.log("response.. for getting jobstatus",response);
    const { job_id, status, result, brand_profile_id } = response.data;

    // Update brandProfiles table if brand_profile_id is returned
    // console.log("brand_profile_id....................",brand_profile_id);
    if (brand_profile_id) {
      await db.update(brandProfiles)
        .set({ profileId: brand_profile_id, data: { ...result, status } })
        .where(eq(brandProfiles.jobId, jobId));
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Job Status:', error.response?.data || error.message);
    throw error;
  }
};

// Get Brand Profile
static getBrandProfile = async (profileId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${profileId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Brand Profile:', error.response?.data || error.message);
    throw error;
  }
};
}
  