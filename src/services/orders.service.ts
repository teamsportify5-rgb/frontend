import api from '@/lib/api'

export interface Order {
  order_id: number
  customer_id: number
  product: string
  quantity: number
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  due_date?: string
  created_at: string
}

export interface CreateOrder {
  customer_id: number
  product: string
  quantity: number
  due_date?: string
}

export interface UpdateOrder {
  product?: string
  quantity?: number
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed'
  due_date?: string
}

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders')
    return response.data
  },

  getById: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`)
    return response.data
  },

  create: async (data: CreateOrder): Promise<Order> => {
    const response = await api.post<Order>('/orders', data)
    return response.data
  },

  update: async (id: number, data: UpdateOrder): Promise<Order> => {
    const response = await api.put<Order>(`/orders/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/orders/${id}`)
  },

  getProducts: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/orders/products')
    return response.data
  },
}


