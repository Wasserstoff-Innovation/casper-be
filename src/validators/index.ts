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

export const CarouselIdeasSchema = z.object({
  body: z.object({
    product_category: z.string().min(1, "Product category is required"),
    product_description: z.string().min(1, "Product description is required"),
    target_audience: z.string().min(1, "Target audience is required"),
    pain_point: z.string().min(1, "Pain point is required"),
    content_goal: z.string().min(1, "Content goal is required"),
    industry_focus: z.string().min(1, "Industry focus is required"),
  }),
});

export const CarouselFramePromptsSchema = z.object({
  body: z.object({
    user_inputs: z.object({}),
    selected_idea: z.object({
      title: z.string(),
      description: z.string(),
    }),
    platform: z.string().min(1, "Platform is required"),
    brand_tone: z.string().min(1, "Brand tone is required"),
    call_to_action: z.string().min(1, "Call to action is required"),
    visual_style: z.string().min(1, "Visual style is required"),
    key_statistics: z.string().optional(),
    personal_story: z.string().optional(),
  }),
});

// Mascot Schemas
export const MascotPromptsSchema = z.object({
  body: z.object({
    brand_description: z.string().min(1, "Brand description is required"),
    primary_audience: z.string().min(1, "Primary audience is required"),
    desired_feeling: z.string().min(1, "Desired feeling is required"),
    mascot_idea: z.string().min(1, "Mascot idea is required"),
    visual_style: z.enum([
      "studio_ghibli", "van_gogh", "cyberpunk", "victorian_royalty", 
      "manga", "lego", "muppet", "cookie"
    ]),
    usage_context: z.string().min(1, "Usage context is required"),
    color_preferences: z.string().optional().nullable(),  }),
});

export const MascotGenerateSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt is required"),
  }),
});

// Meme Schemas
export const MemeGenerateSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Text is required"),
    art_style: z.enum([
      "studio_ghibli", "van_gogh", "cyberpunk", "victorian_royalty", 
      "manga", "lego", "muppet", "cookie"
    ]),
    logo_desc: z.string().optional(),
    mascot_desc: z.string().optional(),
    product_desc: z.string().optional(),
  }),
});

// Photography Schemas
export const PhotographyPromptSchema = z.object({
  body: z.object({
    product_name: z.string().min(1, "Product name is required"),
    photography_type: z.string().min(1, "Photography type is required"),
    background_color: z.string().optional(),
  }),
});

export const PhotographyTransformSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt is required"),
  }),
});

// Print Ad Schemas
export const PrintAdGenerateSchema = z.object({
  body: z.object({

  }),
});

// Playground Schemas
export const PlaygroundAnalyzeSchema = z.object({
  body: z.object({
    style_components: z.string().optional().default(""),
    summarize_prompt: z.string().optional().default("false"),
  }),
});

export const PlaygroundGenerateSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt is required"),
    quality: z.enum(["medium", "high"]).optional().default("medium"),
  }),
});

export const PlaygroundEditSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt is required"),
  }),
  params: z.object({
    sessionId: z.string().min(1, "session is required"),
  }),
});

// Common param schemas
export const JobIdSchema = z.object({
  params: z.object({
    jobId: z.string().min(1, "session is required"),
  }),
});

export const SessionIdSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, "sessionid is required"),
  }),
});

export const UserProfileSchema = z.object({
  audience_type: z.string().min(1, "Audience type is required"),
  brand_safety_level: z.string().min(1, "Brand safety level is required"),
  hashtags_always_use: z.array(z.string()).optional(),
  niche: z.string().min(1, "Niche is required"),
  tone_preference: z.string().min(1, "Tone preference is required"),
  voice_keywords: z.array(z.string()).optional(),
});

// Tweet constraints schema
export const TweetConstraintsSchema = z.object({
  max_chars: z.number().min(1, "Max characters must be > 0"),
  no_hashtags: z.boolean(),
  no_mentions: z.boolean(),
  emoji_policy: z.enum(["none", "light", "heavy"]),
  avoid_topics: z.array(z.string()).optional(),
});

// Main generate tweet schema
export const GenerateTweetSchema = z.object({
  raw_idea: z.string().min(1, "Raw idea is required"),
  user_profile: UserProfileSchema,
  target_tone: z.string().min(1, "Target tone is required"),
  constraints: TweetConstraintsSchema,
});

export const InteractTweetSchema = z.object({
  x_post_url: z.string().url("Invalid post URL"),
  user_reaction: z.string().min(1, "User reaction is required"),
  interaction_type: z.enum(["reply", "quote", "retweet"]), 
  user_profile: z.object({
    audience_type: z.string().min(1),
    brand_safety_level: z.string().min(1),
    hashtags_always_use: z.array(z.string()).optional(),
    niche: z.string().min(1),
    tone_preference: z.string().min(1),
    voice_keywords: z.array(z.string()).optional(),
  }),
  target_tone: z.string().min(1),
  constraints: z.object({
    max_chars: z.number().min(1),
    no_hashtags: z.boolean(),
    no_mentions: z.boolean(),
    emoji_policy: z.enum(["none", "light", "heavy"]),
    avoid_topics: z.array(z.string()).optional(),
  }),
  instruction: z.string().min(1, "Instruction is required"),
});


//thread

export const ThreadsUserProfileSchema = z.object({
  audience_type: z.string().min(1, "Audience type is required"),
  brand_safety_level: z.string().min(1, "Brand safety level is required"),
  conversation_starters: z.array(z.string()).optional(),
  niche: z.string().min(1, "Niche is required"),
  tone_preference: z.string().min(1, "Tone preference is required"),
  voice_keywords: z.array(z.string()).optional(),
});

export const ThreadsMediaIntentSchema = z.object({
  type: z.enum(["none", "image", "video", "carousel"]),
  description: z.string().optional(),
  has_text_overlay: z.boolean(),
});

export const ThreadsConstraintsSchema = z.object({
  max_chars: z.number().min(1),
  max_hashtags: z.number().optional(),
  max_mentions: z.number().optional(),
  allow_emojis: z.boolean(),
  avoid_topics: z.array(z.string()).optional(),
});

export const GenerateThreadsSchema = z.object({
  raw_idea: z.string().min(1, "Raw idea is required"),
  user_profile: ThreadsUserProfileSchema,
  tone: z.string().min(1, "Tone is required"),
  include_conversation_starter: z.boolean(),
  media_intent: ThreadsMediaIntentSchema,
  constraints: ThreadsConstraintsSchema,
});

export const LinkedInUserProfileSchema = z.object({
  audience_type: z.string().min(1),
  default_narrative_style: z.string().min(1),
  industry: z.string().min(1),
  role: z.string().min(1),
});

export const LinkedInMediaIntentSchema = z.object({
  type: z.enum(["none", "image", "video", "carousel"]),
  description: z.string().optional(),
  page_count: z.number().optional(),
  poll_question: z.string().optional(),
  poll_options: z.array(z.string()).optional(),
});

export const LinkedInConstraintsSchema = z.object({
  min_chars: z.number().min(1),
  max_chars: z.number().min(1),
  max_hashtags: z.number().optional(),
  allow_emojis: z.boolean(),
  avoid_topics: z.array(z.string()).optional(),
});

export const GenerateLinkedInSchema = z.object({
  raw_idea: z.string().min(1),
  user_profile: LinkedInUserProfileSchema,
  tone: z.string().min(1),
  narrative_template: z.string().min(1),
  allow_emojis: z.boolean(),
  include_cta: z.boolean(),
  instruction: z.string().min(1),
  media_intent: LinkedInMediaIntentSchema,
  constraints: LinkedInConstraintsSchema,
});

// Medium
export const GenerateMediumSchema = z.object({
  post_type: z.string().min(1),
  raw_idea: z.string().min(1),
  target_audience: z.string().min(1),
});

// Blogger
export const GenerateBloggerSchema = z.object({
  include_affiliate_links: z.boolean(),
  post_type: z.string().min(1),
  primary_keyword: z.string().min(1),
  topic: z.string().min(1),
});



