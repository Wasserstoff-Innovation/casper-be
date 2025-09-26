import FormData from "form-data";
import axios from "axios";
import { brandKits, brandProfiles } from "../model/schema";
import db from "../config/db";
import { eq } from "drizzle-orm";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1/brand-kits";

export default class BrandKitsService {
  static async createBrandKit(
  userId: number,
  brandProfileId: string,
  kitDataJson: any,
  files: { [key: string]: any }
) {
  console.log("inside the service");
  try {
    const form = new FormData();
    form.append("kit_data_json", JSON.stringify(kitDataJson));

    if (files.logo_file)
      form.append("logo_file", files.logo_file.buffer, files.logo_file.originalname);

    if (files.mascot_file)
      form.append("mascot_file", files.mascot_file.buffer, files.mascot_file.originalname);

    if (files.additional_images && files.additional_images.length > 0) {
      files.additional_images.forEach((file: any) =>
        form.append("additional_images", file.buffer, file.originalname)
      );
    }

    // Send to 3rd-party API
    const response = await axios.post(`${API_BASE_URL}`, form, {
      headers: form.getHeaders(),
    });

    console.log("response.data....", response.data);

    const checkBrandProfile = await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.profileId, brandProfileId));

    if (checkBrandProfile.length > 0) {
      const savedKit = await db
        .insert(brandKits)
        .values({
          userId,
          brandProfileId: checkBrandProfile[0].id,
          kitData: response.data,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
        console.log("savedKit..........................",savedKit[0]);
      savedKit[0].brandProfileId = brandProfileId;
      console.log("savedKit..........................",savedKit[0]);
      return savedKit[0];
    } else {
      return { message: "brand profile not found" };
    }
  } catch (error: any) {
    console.error("Error in createBrandKit:", error?.response?.data || error.message || error);
    throw new Error(error?.message || "Failed to create brand kit");
  }
}


  static async fetchBrandKit(kitId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${kitId}`);
      // Expected JSON format from the 3rd party
      // console.log("response.data....",response.data)
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        // Handle validation error format
        return { detail: error.response.data.detail };
      }
      throw new Error(error.message);
    }
  }

  static async fetchBrandKitReport(kitId: string) {
    try {
      console.log("inside the fetchBrandKitReport")
      const response = await axios.get(`${API_BASE_URL}/${kitId}/report`
        , {
        headers: { Accept: "text/html" },
      }
    );
    // console.log("response.data....",response.data)  
      return response.data; // HTML string
    } catch (error: any) {
      // console.log("error.... report",error)
      if (error.response && error.response.status === 422) {
        return JSON.stringify({ detail: error.response.data.detail });
      }
      throw new Error(error.message);
    }
  }

}



