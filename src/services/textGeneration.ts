// src/services/twitter.service.ts
import axios from "axios";
import { envConfigs } from "../config/envConfig";



export class textGenerationService {
  private static BASE_URL= envConfigs.aiTextGenerationUrl;
  private static API_KEY = process.env.X_API_KEY;

  static async generateTweet(payload: any) {
    try {
      const response = await axios.post(`${this.BASE_URL}/x/generate`, payload, {
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Error generating tweet:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Failed to generate tweet");
    }
  }

  static async interactWithTweet(interactionData:any) {
    try {
      const response = await axios.post(`${this.BASE_URL}/x/interact`, interactionData, {
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Error interacting with tweet:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Failed to interact with tweet");
    }
  } 

  static async interactTweet(payload: any) {
    try {
      const response = await axios.post(`${this.BASE_URL}/x/interact`, payload);

      return response.data;
    } catch (error: any) {
      console.error("❌ Error generating interaction:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Failed to generate interaction");
    }
  }

  static async generateThreads(payload:any) {
    try {
      const response = await axios.post(`${this.BASE_URL}/threads/generate`, payload, {
      
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Error generating threads:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Failed to generate threads post");
    }
  }
   static async generateLinkedIn(payload: any) {
    try {
      const response = await axios.post(`${this.BASE_URL}/linkedin/generate`, payload);
     return response.data;
    } catch (error:any) {
      console.error("❌ Error generating LinkedIn post:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Failed to generate LinkedIn post");  
    }
  }

  static async generateMedium(payload: any) {
   try {
     const response = await axios.post(`${this.BASE_URL}/medium/generate`, payload);
    return response.data;
   } catch (error:any) {
     console.error("❌ Error generating Medium post:", error.response?.data || error.message);
     throw new Error(error.response?.data?.detail || "Failed to generate Medium post");
    
   }
  }

  static async generateBlogger(payload: any) {
   try { 
     const response = await axios.post(`${this.BASE_URL}/blogger/generate`, payload);
    return response.data;
   } catch (error:any) {
     console.error("❌ Error generating Blogger post:", error.response?.data || error.message);
     throw new Error(error.response?.data?.detail || "Failed to generate Blogger post");
   }  
  }
}
