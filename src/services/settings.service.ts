import api from '@/lib/api'

export interface SystemSettings {
  id: number
  tax_rate: number
}

export interface SystemSettingsUpdate {
  tax_rate?: number
}

export const settingsService = {
  get: async (): Promise<SystemSettings> => {
    const response = await api.get<SystemSettings>('/settings/')
    return response.data
  },

  update: async (data: SystemSettingsUpdate): Promise<SystemSettings> => {
    const response = await api.patch<SystemSettings>('/settings/', data)
    return response.data
  },
}
