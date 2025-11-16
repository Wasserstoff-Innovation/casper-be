/**
 * Wisdom Tree API Types for TypeScript Backend
 * 
 * These types match the Python API responses exactly.
 * Use these types when calling the analysis agent API.
 * 
 * Version: 1.1 (Production Ready)
 */

// ============================================================================
// API Request Types
// ============================================================================

export type AnalysisDepth = 'light' | 'medium' | 'deep';

export interface WisdomTreeAnalyzeRequest {
  url: string;
  depth?: AnalysisDepth;
  override_persona?: string; // Optional persona override (e.g., 'saas_startup', 'local_service')
}

export interface JobCreateResponse {
  job_id: string;
  status: 'queued';
  message: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export type JobStatus = 'queued' | 'running' | 'complete' | 'failed' | 'unknown';

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  result?: WisdomTreeAnalysisResult;
  error?: string;
}

export interface WisdomTreeAnalysisResult {
  brand_kit: BrandKit;
  brand_scores: BrandScores;
  brand_roadmap: BrandRoadmap;
  analysis_context: AnalysisContext;
  metadata: AnalysisMetadata;
}

// ============================================================================
// Analysis Context Types
// ============================================================================

export interface AnalysisContext {
  // Input
  original_url: string;
  canonical_url: string;
  final_url?: string | null;
  
  // Resource Classification (Phase 3)
  resource_type?: string | null; // e.g., 'website_marketing', 'social_profile', 'local_listing'
  resource_subtype?: string | null;
  
  // Entity Classification (Phase 4) - NORMALIZED TYPES
  entity_type?: string | null; // Normalized: 'startup_saas', 'local_service', 'ecommerce_dtc', etc.
  business_model?: string | null; // 'b2b', 'b2c', 'b2b2c', 'marketplace', etc.
  channel_orientation?: string | null; // 'online_first', 'offline_first', 'hybrid'
  
  // Persona Selection (Phase 5)
  persona_id?: string | null; // e.g., 'saas_startup', 'local_service'
  persona_label?: string | null; // e.g., 'SaaS Startup', 'Local Service Business'
  persona_config?: PersonaConfig | null;
  
  // Progress Tracking
  phase_status: Record<string, PhaseStatus>;
  phase_completion: PhaseCompletion;
  progress_percentage: number;
  
  // Timestamps
  started_at?: string | null; // ISO 8601
  completed_at?: string | null; // ISO 8601
  
  // Errors
  errors: AnalysisError[];
  
  // Additional fields (for backward compatibility)
  entity_profile?: EntityProfile | null;
  modules_executed?: string[];
  modules_skipped?: string[];
}

export type PhaseStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export interface PhaseCompletion {
  normalization: boolean;
  resource_classification: boolean;
  entity_classification: boolean;
  persona_selection: boolean;
  evidence_collection: boolean;
  modules_execution: boolean;
  scoring: boolean;
  brandkit_mapping: boolean;
  roadmap: boolean;
}

export interface AnalysisError {
  phase: string;
  error: string;
  timestamp: string; // ISO 8601
}

// ============================================================================
// Entity Classification Types
// ============================================================================

export interface EntityProfile {
  entity_type: string; // Granular type (e.g., 'startup_saas_b2b') - internal use
  business_model: string; // 'b2b', 'b2c', 'b2b2c', etc.
  channel_orientation: string; // 'online_first', 'offline_first', 'hybrid'
  confidence: number; // 0.0 to 1.0
  signals?: Record<string, any>;
  industry?: string | null;
}

// Normalized Entity Types (for API responses)
export type NormalizedEntityType = 
  | 'startup_saas'
  | 'local_service'
  | 'ecommerce_dtc'
  | 'personal_brand'
  | 'agency'
  | 'content_creator'
  | 'unknown';

export type BusinessModel = 
  | 'b2b'
  | 'b2c'
  | 'b2b2c'
  | 'marketplace'
  | 'media_content'
  | 'services'
  | 'product'
  | 'nonprofit'
  | 'unknown';

export type ChannelOrientation = 
  | 'online_first'
  | 'offline_first'
  | 'hybrid'
  | 'unknown';

// ============================================================================
// Persona Types
// ============================================================================

export interface PersonaConfig {
  persona_id: string;
  label: string;
  description: string;
  activation_rules: PersonaActivationRules;
  priority: number; // 0-100, higher = more specific
  module_weights: Record<string, number>;
  scoring_weights: Record<string, number>;
  roadmap_priorities: Record<string, number>;
  not_applicable_fields: string[];
}

export interface PersonaActivationRules {
  entity_type?: string[]; // Normalized entity types
  business_model?: string[];
  channel_orientation?: string[];
}

export interface PersonaListResponse {
  personas: PersonaSummary[];
  description: string;
}

export interface PersonaSummary {
  id: string;
  label: string;
  description: string;
  activation_rules: PersonaActivationRules;
  priority: number;
}

// ============================================================================
// Brand Scores Types (v1.1 - Enhanced with Status)
// ============================================================================

export interface BrandScores {
  dimensions: Record<string, DimensionScore>;
  overall_score: number | null;
  metadata?: {
    persona_id: string;
    calculated_at: string; // ISO 8601
  };
}

export interface DimensionScore {
  value: number | null; // 0-100 or null
  status: DimensionScoreStatus;
  contributing_modules: string[];
  confidence: number; // 0.0 to 1.0
}

export type DimensionScoreStatus = 
  | 'scored'              // Has a calculated 0-100 value
  | 'not_applicable'      // Not relevant for this persona
  | 'insufficient_data';  // Persona cares but not enough evidence

// Scoring Dimensions
export type ScoringDimension = 
  | 'visual_clarity'
  | 'verbal_clarity'
  | 'positioning'
  | 'presence'
  | 'conversion_trust'
  | 'strategic_foundation';

// ============================================================================
// Brand Roadmap Types (v1.1 - Enhanced with Gaps)
// ============================================================================

export interface BrandRoadmap {
  quick_wins: RoadmapTask[];
  projects: RoadmapTask[];
  long_term: RoadmapTask[]; // NEW in v1.1
  total_tasks: number;
  estimated_timeline: string; // NEW in v1.1 (e.g., "2-3 weeks")
  analysis_persona: { // NEW in v1.1
    id: string;
    label: string;
    description: string;
  };
}

export interface RoadmapTask {
  id: string;
  category: TaskCategory;
  priority: TaskPriority;
  effort: TaskEffort;
  impact: TaskImpact;
  description: string;
  source_module?: string; // Which module generated this task
  addresses_critical_gap?: boolean; // NEW in v1.1
}

export type TaskCategory = 
  | 'visual'
  | 'messaging'
  | 'positioning'
  | 'content'
  | 'conversion'
  | 'trust'
  | 'local'
  | 'social'
  | 'other';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskEffort = 'low' | 'medium' | 'high';

export type TaskImpact = 'high' | 'medium' | 'low';

// ============================================================================
// Brand Kit Types
// ============================================================================

export interface BrandKit {
  // This is the v2_raw format from the analysis agent
  // Structure matches your existing BrandKit schema
  [key: string]: any;
}

// Field Status Types (for comprehensive format)
export type FieldStatus = 
  | 'found'           // Directly observed/scraped
  | 'inferred'        // AI-synthesized from context
  | 'missing'         // Relevant but not present (hurts completeness)
  | 'not_applicable'; // Doesn't apply to persona (doesn't hurt completeness)

// ============================================================================
// Analysis Metadata
// ============================================================================

export interface AnalysisMetadata {
  pipeline: 'wisdom_tree';
  version: string; // e.g., '1.0', '1.1'
  persona: string | null; // Selected persona ID
  entity_type: string | null; // Normalized entity type
  business_model: string | null;
  resource_type: string | null;
}

// ============================================================================
// Gaps Summary (used in roadmap prioritization)
// ============================================================================

export interface GapsSummary {
  by_section: Record<string, SectionGaps>;
  critical_gaps: CriticalGap[];
  total_completeness: number; // Percentage (0-100)
  total_fields: number;
  filled_fields: number;
  not_applicable_fields: number; // NEW in v1.1
}

export interface SectionGaps {
  missing_count: number;
  not_applicable_count: number; // NEW in v1.1
  completeness_percentage: number; // Excludes not_applicable fields
}

export interface CriticalGap {
  field: string; // Dot-notation path (e.g., 'visual_identity.logos.primary_logo_url')
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

// ============================================================================
// Resource Classification Types
// ============================================================================

export type ResourceType = 
  | 'website_marketing'
  | 'social_profile'
  | 'local_listing'
  | 'app_store'
  | 'marketplace'
  | 'b2b_directory'
  | 'other';

export interface ResourceClassification {
  resource_type: ResourceType;
  platform?: string | null; // e.g., 'linkedin', 'gmb', 'g2'
  canonical_url: string;
  confidence: number; // 0.0 to 1.0
}

// ============================================================================
// Helper Types for API Calls
// ============================================================================

/**
 * Type guard to check if a job is complete
 */
export function isJobComplete(job: JobStatusResponse): job is JobStatusResponse & { result: WisdomTreeAnalysisResult } {
  return job.status === 'complete' && job.result !== undefined;
}

/**
 * Type guard to check if a dimension is scored
 */
export function isDimensionScored(score: DimensionScore): score is DimensionScore & { value: number } {
  return score.status === 'scored' && score.value !== null;
}

/**
 * Get normalized entity type from granular type
 * Maps granular types like 'startup_saas_b2b' to 'startup_saas'
 */
export function normalizeEntityType(granularType: string): NormalizedEntityType {
  const normalizationMap: Record<string, NormalizedEntityType> = {
    'startup_saas_b2b': 'startup_saas',
    'startup_saas_b2c': 'startup_saas',
    'enterprise_software': 'startup_saas',
    'local_service': 'local_service',
    'local_retail': 'local_service',
    'local_professional': 'local_service',
    'ecommerce_dtc': 'ecommerce_dtc',
    'ecommerce_dropship': 'ecommerce_dtc',
    'ecommerce_marketplace': 'ecommerce_dtc',
    'content_creator': 'content_creator',
    'media_publication': 'content_creator',
    'personal_brand_professional': 'personal_brand',
    'personal_brand_creator': 'personal_brand',
    'agency': 'agency',
    'consultancy': 'agency',
  };
  
  return normalizationMap[granularType] || 'unknown';
}

