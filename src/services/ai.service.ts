import api from '@/lib/api'

export interface AIImageRequest {
  prompt: string
}

export interface AIImageResponse {
  image_id: number
  user_id: number
  prompt_text: string
  generated_image_url: string
  created_at: string
}

export const aiService = {
  async generateImage(prompt: string, logoFile?: File | null): Promise<AIImageResponse> {
    const form = new FormData()
    form.append('prompt', prompt)
    if (logoFile) {
      form.append('logo', logoFile)
    }
    const response = await api.post<AIImageResponse>('/ai/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async generatePerformanceSummary(): Promise<AIImageResponse> {
    const response = await api.post<AIImageResponse>('/ai/generate/performance-summary')
    return response.data
  },

  async generateStockSummary(): Promise<AIImageResponse> {
    const response = await api.post<AIImageResponse>('/ai/generate/stock-summary')
    return response.data
  },

  async getUserImages(): Promise<AIImageResponse[]> {
    const response = await api.get<AIImageResponse[]>('/ai/images')
    return response.data
  },

  async getAllImages(): Promise<AIImageResponse[]> {
    const response = await api.get<AIImageResponse[]>('/ai/images/all')
    return response.data
  },
}




