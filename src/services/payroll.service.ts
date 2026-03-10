import api from '@/lib/api'

export interface Payroll {
  payroll_id: number
  employee_id: number
  days_present: number
  basic_salary: number
  deductions: number
  bonus: number
  net_pay: number
  month: string
  generated_at: string
}

export interface GeneratePayrollRequest {
  month?: string
  days_present?: number
  basic_salary?: number
  deductions?: number
  bonus?: number
}

export interface UpdatePayrollRequest {
  days_present?: number
  basic_salary?: number
  deductions?: number
  bonus?: number
}

export const payrollService = {
  generate: async (employeeId: number, data?: GeneratePayrollRequest): Promise<Payroll> => {
    const response = await api.post<Payroll>(`/payroll/generate/${employeeId}`, data || {})
    return response.data
  },

  getAll: async (): Promise<Payroll[]> => {
    const response = await api.get<Payroll[]>(`/payroll`)
    return response.data
  },

  getByEmployee: async (employeeId: number): Promise<Payroll[]> => {
    const response = await api.get<Payroll[]>(`/payroll/${employeeId}`)
    return response.data
  },

  downloadSlip: async (payrollId: number): Promise<Blob> => {
    const response = await api.get(`/payroll/slip/${payrollId}`, {
      responseType: 'blob',
    })
    return response.data
  },

  update: async (payrollId: number, data: UpdatePayrollRequest): Promise<Payroll> => {
    const response = await api.put<Payroll>(`/payroll/update/${payrollId}`, data)
    return response.data
  },

  delete: async (payrollId: number): Promise<void> => {
    await api.delete(`/payroll/delete/${payrollId}`)
  },
}


