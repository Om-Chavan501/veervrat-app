import { api } from './client'

export interface InviteOut {
  code: string
  uses_count: number
}

export interface InviteValidateOut {
  inviter_name: string
}

export interface InviteJoinedItem {
  name: string
  joined_at: string
}

export const invitesApi = {
  getMine: () => api.get<InviteOut>('/invites/mine').then((r) => r.data),

  validate: (code: string) =>
    api.get<InviteValidateOut>(`/invites/validate/${code}`).then((r) => r.data),

  getJoined: () => api.get<InviteJoinedItem[]>('/invites/joined').then((r) => r.data),
}
