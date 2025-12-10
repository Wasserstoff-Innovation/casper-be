/**
 * MODEL EXPORTS
 *
 * This file exports Mongoose models and their document interfaces.
 *
 * IMPORTANT: For type definitions (ColorInfo, FieldValue, ComprehensiveBrandKit, etc.),
 * import from 'src/types/brand.types.ts' - the single source of truth.
 */

// ============================================================================
// User
// ============================================================================
export { User, IUser } from './User';

// ============================================================================
// Brand Profile (summary data for list views)
// ============================================================================
export { BrandProfile, IBrandProfile } from './BrandProfile';

// ============================================================================
// Brand Kit (detailed brand data)
// ============================================================================
export { BrandKit, IBrandKit } from './BrandKit';

// ============================================================================
// Brand Roadmap
// ============================================================================
export {
  BrandRoadmapCampaign,
  BrandRoadmapMilestone,
  BrandRoadmapTask,
  IBrandRoadmapCampaign,
  IBrandRoadmapMilestone,
  IBrandRoadmapTask
} from './BrandRoadmap';

// ============================================================================
// Brand Social Profile
// ============================================================================
export {
  BrandSocialProfile,
  IBrandSocialProfile,
  ISocialProfileItem,
  SocialProfileStatus
} from './BrandSocialProfile';

// ============================================================================
// Brand Intelligence Job (job tracking + computed fields)
// ============================================================================
export {
  BrandIntelligenceJob,
  IBrandIntelligenceJob,
  JobStatus,
  PhaseStatus,
  // Re-exported type aliases for backwards compatibility
  // (source of truth is types/brand.types.ts)
  IStrengthRisk,
  ICriticalGap,
  ISnapshot,
  IDataQuality,
  IChannel,
  IProgress,
  // Model-specific types
  IScores,
  IBrandInfo,
  IRoadmapSummary,
  IContext,
  IResult
} from './BrandIntelligenceJob';

// ============================================================================
// Visited User
// ============================================================================
export { VisitedUser, IVisitedUser } from './VisitedUser';

// ============================================================================
// Image Generation
// ============================================================================
export {
  ImageGenerationJob,
  CarouselGeneration,
  MascotGeneration,
  MemeGeneration,
  PlaygroundSession,
  PlaygroundJob,
  PhotographyGeneration,
  PrintAdGeneration,
  IImageGenerationJob,
  ICarouselGeneration,
  IMascotGeneration,
  IMemeGeneration,
  IPlaygroundSession,
  IPlaygroundJob,
  IPhotographyGeneration,
  IPrintAdGeneration
} from './ImageGeneration';

// ============================================================================
// Campaign (Legacy)
// ============================================================================
export { CampaignPlan, ContentCalendar, ICampaignPlan, IContentCalendar } from './Campaign';

// ============================================================================
// New Campaign System (Python backend collections)
// ============================================================================
export { CalendarPost, ICalendarPost, IContentConcept, ICreativeDirection, IPrerequisites, IProductionRequirements, IStrategicContext } from './CalendarPost';
export { CampaignNew, ICampaignNew, CampaignStatus, ICampaignGoal } from './CampaignNew';
export { BrandRecommendation, IBrandRecommendation, IRecommendation, IRecommendationGoal, IPlatformStrategy, IConversationMessage } from './BrandRecommendation';
export { BrandResource, IBrandResource, ResourceType } from './BrandResource';
