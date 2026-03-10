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

export const notificationsService = {
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




