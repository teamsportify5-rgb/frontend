import api from '@/lib/api'

export interface NotificationRequest {
  title: string
  body: string
  data?: Record<string, string>
}

export interface NotificationResponse {
  success: boolean
  message: string
  message_id?: string
}

export interface NotificationLog {
  id: number
  user_id: number
  sent_by_user_id?: number | null
  title: string
  body: string
  notification_type: string
  is_read: boolean
  created_at: string
}

export const notificationsService = {
  async getHistory(scope: 'mine' | 'all' = 'mine'): Promise<NotificationLog[]> {
    const response = await api.get<NotificationLog[]>('/notify/history', { params: { scope } })
    return response.data
  },

  async markRead(id: number): Promise<NotificationLog> {
    const response = await api.patch<NotificationLog>(`/notify/history/${id}/read`)
    return response.data
  },

  async markAllRead(): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>('/notify/history/read-all')
    return response.data
  },

  async notifyUser(userId: number, notification: NotificationRequest): Promise<NotificationResponse> {
    const response = await api.post<NotificationResponse>(
      `/notify/user/${userId}`,
      notification
    )
    return response.data
  },

  async notifyAll(notification: NotificationRequest): Promise<NotificationResponse> {
    const response = await api.post<NotificationResponse>('/notify/all', notification)
    return response.data
  },

  async notifyByToken(token: string, notification: NotificationRequest): Promise<NotificationResponse> {
    const response = await api.post<NotificationResponse>(
      `/notify/token?fcm_token=${encodeURIComponent(token)}`,
      notification
    )
    return response.data
  },
}
