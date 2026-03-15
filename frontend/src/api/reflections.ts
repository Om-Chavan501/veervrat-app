import { api } from './client'
import type { Reflection } from '../types'

export const reflectionsApi = {
  list: (journeyId: string) =>
    api.get<Reflection[]>(`/journeys/${journeyId}/reflections`).then((r) => r.data),

  getToday: (journeyId: string) =>
    api.get<Reflection | null>(`/journeys/${journeyId}/reflections/today`).then((r) => r.data),

  create: (
    journeyId: string,
    data: { applied: boolean; context_note: string; insight_note: string; difficulty?: number }
  ) => api.post<Reflection>(`/journeys/${journeyId}/reflections`, data).then((r) => r.data),

  update: (
    journeyId: string,
    reflectionId: string,
    data: { applied?: boolean; context_note?: string; insight_note?: string; difficulty?: number }
  ) =>
    api
      .put<Reflection>(`/journeys/${journeyId}/reflections/${reflectionId}`, data)
      .then((r) => r.data),

  delete: (journeyId: string, reflectionId: string) =>
    api.delete(`/journeys/${journeyId}/reflections/${reflectionId}`).then((r) => r.data),

  addComment: (journeyId: string, reflectionId: string, text: string) =>
    api
      .post<Reflection>(`/journeys/${journeyId}/reflections/${reflectionId}/comments`, { text })
      .then((r) => r.data),
}
