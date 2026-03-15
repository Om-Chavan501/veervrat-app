import { api } from './client'
import type { Journey, JourneyDetail, Resolution, ClarificationLink, IrrationalBelief, JourneyState } from '../types'

export const journeysApi = {
  list: (state?: JourneyState) =>
    api.get<Journey[]>('/journeys', { params: state ? { state } : {} }).then((r) => r.data),

  create: (sentence_id: string, assessment_id: string) =>
    api.post<JourneyDetail>('/journeys', { sentence_id, assessment_id }).then((r) => r.data),

  get: (id: string) => api.get<JourneyDetail>(`/journeys/${id}`).then((r) => r.data),

  saveClarification: (
    journeyId: string,
    assessmentId: string,
    data: {
      virtue_relation_note?: string
      lacuna_reduction_note: string
      unified_insight_note: string
      personal_context_note: string
      irrational_belief: IrrationalBelief
    }
  ) =>
    api
      .post<ClarificationLink>(`/journeys/${journeyId}/clarify/${assessmentId}`, data)
      .then((r) => r.data),

  getClarifications: (journeyId: string) =>
    api.get<ClarificationLink[]>(`/journeys/${journeyId}/clarifications`).then((r) => r.data),

  addResolution: (journeyId: string, text: string, frequency: string) =>
    api.post<Resolution>(`/journeys/${journeyId}/resolutions`, { text, frequency }).then((r) => r.data),

  updateResolution: (journeyId: string, resolutionId: string, text: string, frequency: string) =>
    api
      .put<Resolution>(`/journeys/${journeyId}/resolutions/${resolutionId}`, { text, frequency })
      .then((r) => r.data),

  deleteResolution: (journeyId: string, resolutionId: string) =>
    api.delete(`/journeys/${journeyId}/resolutions/${resolutionId}`).then((r) => r.data),

  pause: (journeyId: string, reason?: string) =>
    api.post<Journey>(`/journeys/${journeyId}/pause`, { reason }).then((r) => r.data),

  resume: (journeyId: string) =>
    api.post<Journey>(`/journeys/${journeyId}/resume`).then((r) => r.data),

  complete: (journeyId: string) =>
    api.post<Journey>(`/journeys/${journeyId}/complete`).then((r) => r.data),
}
