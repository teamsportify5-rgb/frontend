import api from '@/lib/api'

export interface Attendance {
  id: number
  employee_id: number
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late'
  date: string
}

export interface CheckInRequest {
  employee_id: number
  date?: string
}

export interface CheckOutRequest {
  employee_id: number
}

export const attendanceService = {
  checkIn: async (data: CheckInRequest): Promise<Attendance> => {
    const response = await api.post<Attendance>('/attendance/check-in', data)
    return response.data
  },

  checkOut: async (data: CheckOutRequest): Promise<Attendance> => {
    const response = await api.post<Attendance>('/attendance/check-out', data)
    return response.data
  },

  getToday: async (): Promise<Attendance[]> => {
    const response = await api.get<Attendance[]>('/attendance/today')
    return response.data
  },

  getByEmployee: async (employeeId: number): Promise<Attendance[]> => {
    const response = await api.get<Attendance[]>(`/attendance/employee/${employeeId}`)
    return response.data
  },
}




