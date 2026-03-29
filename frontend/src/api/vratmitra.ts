import { api } from './client'
import type { Vratmitra } from '../types'

export interface GlobalVratmitra {
  id: string
  user_id: string
  vratmitra_id: string
  status: 'PENDING' | 'ACTIVE' | 'DETACHED'
  invited_at: string | null
  accepted_at: string | null
  detached_at: string | null
  vratmitra?: { id: string; name: string; email?: string }
  user?: { id: string; name: string; email?: string }
}

export const vratmitraApi = {
  getPendingInvitations: () =>
    api.get<Vratmitra[]>('/vratmitra/pending').then((r) => r.data),

  getMyMentoredJourneys: () =>
    api.get<Vratmitra[]>('/vratmitra/my-mentored-journeys').then((r) => r.data),

  invite: (journeyId: string, payload: { invitee_email?: string; invitee_id?: string }) =>
    api.post<Vratmitra>(`/vratmitra/journeys/${journeyId}/invite`, payload).then((r) => r.data),

  accept: (journeyId: string) =>
    api.post<Vratmitra>(`/vratmitra/journeys/${journeyId}/accept`).then((r) => r.data),

  detach: (journeyId: string) =>
    api.post<Vratmitra>(`/vratmitra/journeys/${journeyId}/detach`).then((r) => r.data),

  getCurrent: (journeyId: string) =>
    api.get<Vratmitra | null>(`/vratmitra/journeys/${journeyId}/current`).then((r) => r.data),

  // Global Vratmitra
  getGlobal: () =>
    api.get<GlobalVratmitra | null>('/vratmitra/global').then((r) => r.data),

  getGlobalPending: () =>
    api.get<GlobalVratmitra[]>('/vratmitra/global/pending').then((r) => r.data),

  inviteGlobal: (invitee_id: string) =>
    api.post<GlobalVratmitra>('/vratmitra/global', { invitee_id }).then((r) => r.data),

  acceptGlobal: () =>
    api.post<GlobalVratmitra>('/vratmitra/global/accept').then((r) => r.data),

  removeGlobal: () =>
    api.delete('/vratmitra/global'),
}
