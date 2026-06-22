import api from '@/lib/api'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  title: string
  description?: string | null
  assigned_to_id: number
  assigned_to_name?: string | null
  assigned_to_role?: string | null
  assigned_by_id?: number | null
  assigned_by_name?: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date?: string | null
  created_at: string
  updated_at?: string | null
}

export interface CreateTask {
  title: string
  description?: string
  assigned_to_id: number
  priority?: TaskPriority
  due_date?: string
}

export interface UpdateTask {
  title?: string
  description?: string
  assigned_to_id?: number
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
}

export const tasksService = {
  getAll: async (params?: { assigned_to_id?: number; status?: TaskStatus }): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks', { params })
    return response.data
  },

  getById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`)
    return response.data
  },

  create: async (data: CreateTask): Promise<Task> => {
    const response = await api.post<Task>('/tasks', data)
    return response.data
  },

  update: async (id: number, data: UpdateTask): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`)
  },

  getAssignees: async (): Promise<
    { id: number; name: string; email: string; role: string; phone?: string; created_at: string }[]
  > => {
    const response = await api.get('/tasks/assignees')
    return response.data
  },
}
