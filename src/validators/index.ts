import {z} from "zod"

export const validateCampaign = z.object({
  body: z.object({
    brand_profile_id: z.string().min(1, "brand_profile_id is required"),

    product_info: z.object({
      type: z.enum(["existing_product", "new_product"]), // restrict to known values
      details: z.string().nullable(), // can be string or null
      brand_data_summary: z.string().min(10, "brand_data_summary is too short"),
    }),

    social_media_followers: z.object({
      linkedin: z.number().int().nonnegative().optional(),
      instagram: z.number().int().nonnegative().optional(),
      // you can add more if needed (twitter, facebook, etc.)
    }),

    campaign_purpose: z.string().min(3, "campaign_purpose is required"),

    selected_funnel: z.object({
      type: z.string().min(1, "selected_funnel.type is required"),
      stages: z.array(z.string().min(1)).min(1, "at least one stage is required"),
    }),

    content_ideas: z.array(z.string().min(5)).min(1, "at least one content idea is required"),

    posting_frequency_per_week: z.number().int().min(1).max(14), // 1–14 per week
  }),
});