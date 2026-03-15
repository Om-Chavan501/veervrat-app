import { api } from './client'
import type { ShortlistSession } from '../types'

export const shortlistsApi = {
  list: () => api.get<ShortlistSession[]>('/shortlists').then((r) => r.data),

  create: (note?: string) =>
    api.post<ShortlistSession>('/shortlists', { note }).then((r) => r.data),

  get: (id: string) => api.get<ShortlistSession>(`/shortlists/${id}`).then((r) => r.data),

  addItem: (sessionId: string, lacuna_id: string) =>
    api.post<ShortlistSession>(`/shortlists/${sessionId}/items`, { lacuna_id }).then((r) => r.data),

  removeItem: (sessionId: string, lacunaId: string) =>
    api.delete<ShortlistSession>(`/shortlists/${sessionId}/items/${lacunaId}`).then((r) => r.data),
}
