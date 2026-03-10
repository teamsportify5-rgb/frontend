import api from '@/lib/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'accountant' | 'worker' | 'customer'
  phone?: string
  daily_rate?: number
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  phone?: string
  daily_rate?: number
  created_at: string
}

export interface UserUpdate {
  name?: string
  email?: string
  role?: 'admin' | 'manager' | 'accountant' | 'worker' | 'customer'
  phone?: string
  password?: string
  daily_rate?: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  getUsers: async (role?: string): Promise<User[]> => {
    const params = role ? { role } : {}
    const response = await api.get<User[]>('/auth/users', { params })
    return response.data
  },

  updateUser: async (userId: number, data: UserUpdate): Promise<User> => {
    const response = await api.put<User>(`/auth/users/${userId}`, data)
    return response.data
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/auth/users/${userId}`)
  },
}


