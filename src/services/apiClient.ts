import axios, { AxiosInstance } from 'axios';
import { envConfigs } from '../config/envConfig';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey?: string) {
    this.client = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });
  }

  async post(endpoint: string, data: any) {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async postFormData(endpoint: string, formData: any) {
    const response = await this.client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }

  async get(endpoint: string) {
    const response = await this.client.get(endpoint);
    return response.data;
  }
}

// Create clients for all services
export const carouselClient = new ApiClient(
  envConfigs.aiImageGenerationUrl,
  process.env.CAROUSEL_API_KEY
);

export const mascotClient = new ApiClient(
   envConfigs.aiImageGenerationUrl,
  process.env.MASCOT_API_KEY
);

export const memeClient = new ApiClient(
   envConfigs.aiImageGenerationUrl,
  process.env.MEME_API_KEY
);

export const playgroundClient = new ApiClient(
   envConfigs.aiImageGenerationUrl,
  process.env.PLAYGROUND_API_KEY
);

export const photographyClient = new ApiClient(
   envConfigs.aiImageGenerationUrl, 
  process.env.PHOTOGRAPHY_API_KEY
);

export const printAdClient = new ApiClient(
   envConfigs.aiImageGenerationUrl,
  process.env.PRINT_AD_API_KEY
);