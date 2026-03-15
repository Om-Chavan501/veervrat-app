// ─── Enums ────────────────────────────────────────────────────────────────────

export type JourneyState = 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
export type AssessmentStatus = 'IN_PROGRESS' | 'COMPLETED'
export type Rating = 'ALWAYS' | 'OFTEN' | 'RARELY' | 'NEVER'
export type IrrationalBelief = 'MUST_BE_LOVED' | 'MUST_BE_COMPETENT' | 'MUST_HAVE_COMFORT'
export type LacunaCategory = 'A' | 'B' | 'C'
export type GovernanceStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED'
export type ChallengeStatus = 'APPLIED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type VratmitraStatus = 'PENDING' | 'ACTIVE' | 'DETACHED'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// ─── Ontology ─────────────────────────────────────────────────────────────────

export interface Virtue {
  id: string
  name_en: string
  name_mr: string
}

export interface SubVirtue {
  id: string
  name_en: string
  name_mr: string
  virtue_id: string
  virtue?: Virtue
  sentences?: Sentence[]
}

export interface Sentence {
  id: string
  text_en: string
  text_mr: string
  sub_virtue_id: string
  sub_virtue?: SubVirtue
}

export interface Lacuna {
  id: string
  name_en: string
  name_mr: string
  category: LacunaCategory
}

export interface LacunaSubVirtue {
  id: string
  lacuna_id: string
  sub_virtue_id: string
  priority: number
  sub_virtue?: SubVirtue
}

export interface LacunaDetail extends Lacuna {
  lacuna_sub_virtues: LacunaSubVirtue[]
}

// ─── Shortlist ────────────────────────────────────────────────────────────────

export interface ShortlistItem {
  id: string
  session_id: string
  lacuna_id: string
  rank: number
  lacuna?: Lacuna
}

export interface ShortlistSession {
  id: string
  user_id: string
  note?: string
  created_at: string
  items: ShortlistItem[]
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export interface AssessmentResponse {
  id: string
  assessment_id: string
  sentence_id: string
  rating: Rating
  answered_at: string
  sentence?: Sentence
}

export interface SuggestedSnapshot {
  id: string
  assessment_id: string
  sentence_id: string
  priority_rank: number
  reason: string
  sentence?: Sentence
}

export interface Assessment {
  id: string
  user_id: string
  lacuna_id: string
  status: AssessmentStatus
  started_at: string
  completed_at?: string
  shortlist_session_id?: string
  lacuna?: Lacuna
}

export interface AssessmentDetail extends Assessment {
  lacuna?: LacunaDetail
  responses: AssessmentResponse[]
  suggestions: SuggestedSnapshot[]
}

// ─── Journey ──────────────────────────────────────────────────────────────────

export interface Resolution {
  id: string
  journey_id: string
  text: string
  frequency: string
  created_at: string
}

export interface ClarificationLink {
  id: string
  journey_id: string
  assessment_id: string
  virtue_relation_note?: string
  lacuna_reduction_note: string
  unified_insight_note: string
  personal_context_note: string
  irrational_belief: IrrationalBelief
  created_at: string
  assessment?: Assessment
}

export interface Journey {
  id: string
  user_id: string
  sentence_id: string
  state: JourneyState
  created_at: string
  inactive_at?: string
  inactive_reason?: string
  sentence?: Sentence
}

export interface JourneyDetail extends Journey {
  links: ClarificationLink[]
  resolutions: Resolution[]
}

// ─── Reflection ───────────────────────────────────────────────────────────────

export interface ReflectionComment {
  id: string
  reflection_id: string
  user_id: string
  text: string
  created_at: string
  user?: User
}

export interface Reflection {
  id: string
  journey_id: string
  date: string
  applied: boolean
  context_note?: string
  insight_note?: string
  difficulty?: number
  created_at: string
  comments: ReflectionComment[]
}

// ─── Exposure ─────────────────────────────────────────────────────────────────

export interface Exposure {
  id: string
  journey_id: string
  description: string
  context_note?: string
  created_at: string
}

// ─── Vratmitra ────────────────────────────────────────────────────────────────

export interface Vratmitra {
  id: string
  journey_id: string
  user_id: string
  status: VratmitraStatus
  created_at: string
  accepted_at?: string
  detached_at?: string
  user?: User
  journey?: Journey
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  active_journeys: number
  total_reflections: number
  pending_invitations: number
  completed_journeys: number
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[]
}
