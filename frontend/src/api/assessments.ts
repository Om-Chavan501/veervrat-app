import { api } from './client'
import type { Assessment, AssessmentDetail, SuggestedSnapshot, Rating } from '../types'

export const assessmentsApi = {
  list: () => api.get<Assessment[]>('/assessments').then((r) => r.data),

  start: (lacuna_id: string, shortlist_session_id?: string) =>
    api.post<Assessment>('/assessments/start', { lacuna_id, shortlist_session_id }).then((r) => r.data),

  get: (id: string) => api.get<AssessmentDetail>(`/assessments/${id}`).then((r) => r.data),

  saveResponse: (assessmentId: string, sentence_id: string, rating: Rating) =>
    api.post(`/assessments/${assessmentId}/responses`, { sentence_id, rating }).then((r) => r.data),

  deleteResponse: (assessmentId: string, sentenceId: string) =>
    api.delete(`/assessments/${assessmentId}/responses/${sentenceId}`).then((r) => r.data),

  complete: (id: string) =>
    api.post<AssessmentDetail>(`/assessments/${id}/complete`).then((r) => r.data),

  getSuggestions: (id: string) =>
    api.get<SuggestedSnapshot[]>(`/assessments/${id}/suggestions`).then((r) => r.data),
}
