import { api } from './client'
import type { Lacuna, LacunaDetail } from '../types'

export const lacunaeApi = {
  list: () => api.get<Lacuna[]>('/ontology/lacunae').then((r) => r.data),
  get: (id: string) => api.get<LacunaDetail>(`/ontology/lacunae/${id}`).then((r) => r.data),
}
