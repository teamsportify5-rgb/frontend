import api from '@/lib/api'

export interface Inventory {
  id: number
  item: string
  category: string
  quantity: number
  threshold: number
  unit: string
  created_at: string
  updated_at?: string
}

export interface CreateInventory {
  item: string
  category: string
  quantity: number
  threshold: number
  unit: string
}

export interface UpdateInventory {
  item?: string
  category?: string
  quantity?: number
  threshold?: number
  unit?: string
}

export const inventoryService = {
  getAll: async (): Promise<Inventory[]> => {
    const response = await api.get<Inventory[]>('/inventory')
    return response.data
  },

  getById: async (id: number): Promise<Inventory> => {
    const response = await api.get<Inventory>(`/inventory/${id}`)
    return response.data
  },

  create: async (data: CreateInventory): Promise<Inventory> => {
    const response = await api.post<Inventory>('/inventory', data)
    return response.data
  },

  update: async (id: number, data: UpdateInventory): Promise<Inventory> => {
    const response = await api.put<Inventory>(`/inventory/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/inventory/${id}`)
  },
}



