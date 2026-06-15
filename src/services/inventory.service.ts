import api from '@/lib/api'

export interface Inventory {
  id: number
  item: string
  category: string
  quantity: number
  threshold: number
  unit: string
  unit_price: number
  estimated_value: number
  created_at: string
  updated_at?: string
}

export interface InventorySummary {
  total_items: number
  low_stock_count: number
  total_estimated_value: number
}

export interface CreateInventory {
  item: string
  category: string
  quantity: number
  threshold: number
  unit: string
  unit_price: number
}

export interface UpdateInventory {
  item?: string
  category?: string
  quantity?: number
  threshold?: number
  unit?: string
  unit_price?: number
}

export function formatInventoryRs(amount: number): string {
  return `Rs ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function lineInventoryValue(item: Pick<Inventory, 'quantity' | 'unit_price'>): number {
  return Math.round(item.quantity * (item.unit_price ?? 0) * 100) / 100
}

export const inventoryService = {
  getAll: async (): Promise<Inventory[]> => {
    const response = await api.get<Inventory[]>('/inventory')
    return response.data
  },

  getSummary: async (): Promise<InventorySummary> => {
    const response = await api.get<InventorySummary>('/inventory/summary')
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
