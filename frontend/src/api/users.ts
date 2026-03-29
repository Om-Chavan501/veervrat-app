import { api } from './client'

export interface UserSearchItem {
  id: string
  name: string
  email?: string
}

export async function search(q: string): Promise<UserSearchItem[]> {
  const res = await api.get('/users/search', { params: { q } })
  return res.data
}
