import { api } from './client'
import type { Exposure } from '../types'

export const exposuresApi = {
  list: (journeyId: string) =>
    api.get<Exposure[]>(`/journeys/${journeyId}/exposures`).then((r) => r.data),

  create: (journeyId: string, description: string, context_note?: string) =>
    api
      .post<Exposure>(`/journeys/${journeyId}/exposures`, { description, context_note })
      .then((r) => r.data),

  update: (journeyId: string, exposureId: string, description?: string, context_note?: string) =>
    api
      .put<Exposure>(`/journeys/${journeyId}/exposures/${exposureId}`, { description, context_note })
      .then((r) => r.data),

  delete: (journeyId: string, exposureId: string) =>
    api.delete(`/journeys/${journeyId}/exposures/${exposureId}`).then((r) => r.data),
}
