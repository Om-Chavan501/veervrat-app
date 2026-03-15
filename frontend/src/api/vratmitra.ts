import { api } from './client'
import type { Vratmitra } from '../types'

export const vratmitraApi = {
  getPendingInvitations: () =>
    api.get<Vratmitra[]>('/vratmitra/pending').then((r) => r.data),

  getMyMentoredJourneys: () =>
    api.get<Vratmitra[]>('/vratmitra/my-mentored-journeys').then((r) => r.data),

  invite: (journeyId: string, invitee_email: string) =>
    api.post<Vratmitra>(`/vratmitra/journeys/${journeyId}/invite`, { invitee_email }).then((r) => r.data),

  accept: (journeyId: string) =>
    api.post<Vratmitra>(`/vratmitra/journeys/${journeyId}/accept`).then((r) => r.data),

  detach: (journeyId: string) =>
    api.post<Vratmitra>(`/vratmitra/journeys/${journeyId}/detach`).then((r) => r.data),

  getCurrent: (journeyId: string) =>
    api.get<Vratmitra | null>(`/vratmitra/journeys/${journeyId}/current`).then((r) => r.data),
}
