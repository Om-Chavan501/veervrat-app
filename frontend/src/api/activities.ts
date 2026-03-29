import { api } from './client'
import type {
  ExposureCatalogItem, ResolutionCatalogItem, ChallengeCatalogItem,
  JourneyExposure, JourneyResolution, JourneyChallenge,
  ExposureStatus, ResolutionStatus, ChallengeStatus,
} from '../types'

export const activitiesApi = {
  // ─── Catalog ───────────────────────────────────────────────────────────────

  getCatalogExposures: (sentenceId: string) =>
    api.get<ExposureCatalogItem[]>('/catalog/exposures', { params: { sentence_id: sentenceId } }).then((r) => r.data),

  getCatalogResolutions: (sentenceId: string) =>
    api.get<ResolutionCatalogItem[]>('/catalog/resolutions', { params: { sentence_id: sentenceId } }).then((r) => r.data),

  getCatalogChallenges: (sentenceId: string) =>
    api.get<ChallengeCatalogItem[]>('/catalog/challenges', { params: { sentence_id: sentenceId } }).then((r) => r.data),

  // ─── Journey Exposures ─────────────────────────────────────────────────────

  listExposures: (journeyId: string) =>
    api.get<JourneyExposure[]>(`/journeys/${journeyId}/exposures`).then((r) => r.data),

  addExposure: (journeyId: string, payload: { catalog_item_id?: string; title: string; description?: string }) =>
    api.post<JourneyExposure>(`/journeys/${journeyId}/exposures`, payload).then((r) => r.data),

  updateExposure: (
    journeyId: string,
    exposureId: string,
    payload: { title?: string; description?: string; status?: ExposureStatus }
  ) =>
    api.put<JourneyExposure>(`/journeys/${journeyId}/exposures/${exposureId}`, payload).then((r) => r.data),

  deleteExposure: (journeyId: string, exposureId: string) =>
    api.delete(`/journeys/${journeyId}/exposures/${exposureId}`).then((r) => r.data),

  // ─── Journey Resolutions ───────────────────────────────────────────────────

  listResolutions: (journeyId: string) =>
    api.get<JourneyResolution[]>(`/journeys/${journeyId}/resolutions`).then((r) => r.data),

  addResolution: (
    journeyId: string,
    payload: { catalog_item_id?: string; title: string; description?: string; frequency: string }
  ) =>
    api.post<JourneyResolution>(`/journeys/${journeyId}/resolutions`, payload).then((r) => r.data),

  updateResolution: (
    journeyId: string,
    resolutionId: string,
    payload: { title?: string; description?: string; frequency?: string; status?: ResolutionStatus }
  ) =>
    api.put<JourneyResolution>(`/journeys/${journeyId}/resolutions/${resolutionId}`, payload).then((r) => r.data),

  deleteResolution: (journeyId: string, resolutionId: string) =>
    api.delete(`/journeys/${journeyId}/resolutions/${resolutionId}`).then((r) => r.data),

  // ─── Journey Challenge ─────────────────────────────────────────────────────

  getChallenge: (journeyId: string) =>
    api.get<JourneyChallenge>(`/journeys/${journeyId}/challenge`).then((r) => r.data),

  addChallenge: (
    journeyId: string,
    payload: { catalog_item_id?: string; title: string; description?: string; achievement_criteria: string }
  ) =>
    api.post<JourneyChallenge>(`/journeys/${journeyId}/challenge`, payload).then((r) => r.data),

  setChallengeOutcome: (journeyId: string, outcome: Extract<ChallengeStatus, 'COMPLETED' | 'ABANDONED'>) =>
    api.post<JourneyChallenge>(`/journeys/${journeyId}/challenge/outcome`, { outcome }).then((r) => r.data),

  deleteChallenge: (journeyId: string) =>
    api.delete(`/journeys/${journeyId}/challenge`).then((r) => r.data),
}
