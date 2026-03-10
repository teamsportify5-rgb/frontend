import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { payrollService, Payroll as PayrollType, UpdatePayrollRequest } from '@/services/payroll.service'
import { authService, User } from '@/services/auth.service'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Download, Plus, Pencil, RefreshCw, Trash2 } from 'lucide-react'

export default function Payroll() {
  const [payrolls, setPayrolls] = useState<PayrollType[]>([])
  const [workers, setWorkers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollType | null>(null)
  const [month, setMonth] = useState('')
  const [daysPresent, setDaysPresent] = useState<string>('')
  const [basicSalary, setBasicSalary] = useState<string>('')
  const [deductions, setDeductions] = useState<string>('')
  const [bonus, setBonus] = useState<string>('')
  const [editFormData, setEditFormData] = useState<UpdatePayrollRequest>({
    days_present: 0,
    basic_salary: 0,
    deductions: 0,
    bonus: 0,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchPayrolls()
    if (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant') {
      fetchWorkers()
    }
  }, [user])

  const fetchPayrolls = async () => {
    setLoading(true)
    // Clear existing data first to avoid showing stale data
    setPayrolls([])
    try {
      if (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant') {
        // Admin, manager, and accountant can see all payroll records
        const data = await payrollService.getAll()
        setPayrolls(Array.isArray(data) ? data : [])
      } else if (user?.id) {
        // Workers can only see their own payroll
        const data = await payrollService.getByEmployee(user.id)
        setPayrolls(Array.isArray(data) ? data : [])
      } else {
        setPayrolls([])
      }
    } catch (error: any) {
      console.error('Error fetching payrolls:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch payroll',
        variant: 'destructive',
      })
      setPayrolls([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      // Fetch all workers and employees (excluding customers)
      const allUsers = await authService.getUsers()
      const workersList = allUsers.filter(
        (u) => u.role === 'worker' || u.role === 'manager' || u.role === 'accountant' || u.role === 'admin'
      )
      setWorkers(workersList)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch workers',
        variant: 'destructive',
      })
    }
  }

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      toast({
        title: 'Error',
        description: 'Please select an employee',
        variant: 'destructive',
      })
      return
    }

    try {
      const generateData: any = {}
      if (month) generateData.month = month
      if (daysPresent && daysPresent.trim() !== '') {
        generateData.days_present = parseInt(daysPresent)
      }
      if (basicSalary && basicSalary.trim() !== '') {
        generateData.basic_salary = parseFloat(basicSalary)
      }
      if (deductions && deductions.trim() !== '') {
        generateData.deductions = parseFloat(deductions)
      }
      if (bonus && bonus.trim() !== '') {
        generateData.bonus = parseFloat(bonus)
      }

      await payrollService.generate(selectedEmployee, Object.keys(generateData).length > 0 ? generateData : undefined)
      toast({
        title: 'Success',
        description: 'Payroll generated successfully',
      })
      setDialogOpen(false)
      setSelectedEmployee(null)
      setMonth('')
      setDaysPresent('')
      setBasicSalary('')
      setDeductions('')
      setBonus('')
      fetchPayrolls()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate payroll',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (payroll: PayrollType) => {
    setSelectedPayroll(payroll)
    setEditFormData({
      days_present: payroll.days_present,
      basic_salary: payroll.basic_salary,
      deductions: payroll.deductions,
      bonus: payroll.bonus,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedPayroll) return

    try {
      await payrollService.update(selectedPayroll.payroll_id, editFormData)
      toast({
        title: 'Success',
        description: 'Payroll updated successfully',
      })
      setEditDialogOpen(false)
      setSelectedPayroll(null)
      fetchPayrolls()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update payroll',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (payrollId: number) => {
    if (!confirm('Are you sure you want to delete this payroll record? This action cannot be undone.')) {
      return
    }

    try {
      await payrollService.delete(payrollId)
      toast({
        title: 'Success',
        description: 'Payroll record deleted successfully',
      })
      fetchPayrolls()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete payroll record',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async (payrollId: number) => {
    try {
      const blob = await payrollService.downloadSlip(payrollId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll_slip_${payrollId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: 'Success',
        description: 'Payroll slip downloaded',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to download payroll slip',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount)
  }

  const canGenerate = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600 mt-2">Manage employee payroll and salary slips</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchPayrolls()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canGenerate && (
          <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (open) {
                // Refresh workers list when dialog opens
                fetchWorkers()
              } else {
                // Reset form when dialog closes
                setSelectedEmployee(null)
                setMonth('')
                setDaysPresent('')
                setBasicSalary('')
                setDeductions('')
                setBonus('')
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll</DialogTitle>
                <DialogDescription>Generate payroll for an employee</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Select Worker *</Label>
                  <Select
                    value={selectedEmployee ? selectedEmployee.toString() : undefined}
                    onValueChange={(value) => setSelectedEmployee(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.length > 0 ? (
                        workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id.toString()}>
                            {worker.name} ({worker.email}) - {worker.role}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-workers" disabled>
                          No workers found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {workers.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No workers found. Please add workers first.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Month (YYYY-MM)</Label>
                  <Input
                    id="month"
                    type="text"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="2024-01 (optional, defaults to current month)"
                  />
                </div>
                {selectedEmployee && (() => {
                  const selectedWorker = workers.find(w => w.id === selectedEmployee)
                  return selectedWorker && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Employee Daily Rate:</p>
                      <p className="text-lg font-bold">
                        {selectedWorker.daily_rate ? `Rs ${selectedWorker.daily_rate.toLocaleString()}` : 'Not set (will use default: Rs 2,000)'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedWorker.daily_rate 
                          ? `Salary = Days Present × ${selectedWorker.daily_rate.toLocaleString()}`
                          : 'Set daily rate in User Management to customize'}
                      </p>
                    </div>
                  )
                })()}
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Manual Override (Optional)</p>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to auto-calculate from attendance. Fill to manually set values.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="days_present">Days Present</Label>
                    <Input
                      id="days_present"
                      type="number"
                      value={daysPresent}
                      onChange={(e) => setDaysPresent(e.target.value)}
                      placeholder="Auto-calculated from attendance if blank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basic_salary">Basic Salary (Rs)</Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      step="0.01"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      placeholder="Auto-calculated if blank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deductions">Deductions (Rs)</Label>
                    <Input
                      id="deductions"
                      type="number"
                      step="0.01"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      placeholder="Auto-calculated (10% of basic) if blank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonus">Bonus (Rs)</Label>
                    <Input
                      id="bonus"
                      type="number"
                      step="0.01"
                      value={bonus}
                      onChange={(e) => setBonus(e.target.value)}
                      placeholder="Auto-calculated if blank"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate}>Generate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant'
              ? 'All Payroll Records'
              : 'My Payroll Records'}
          </CardTitle>
          <CardDescription>
            {user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant'
              ? 'Complete payroll history for all employees'
              : 'Your payroll history'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant') && (
                    <TableHead>Employee</TableHead>
                  )}
                  <TableHead>Payroll ID</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Days Present</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.length > 0 ? (
                  payrolls.map((payroll) => {
                    const employee = workers.find(w => w.id === payroll.employee_id)
                    return (
                      <TableRow key={payroll.payroll_id}>
                        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant') && (
                          <TableCell className="font-medium">
                            {employee ? `${employee.name} (ID: ${payroll.employee_id})` : `Employee ID: ${payroll.employee_id}`}
                          </TableCell>
                        )}
                        <TableCell>{payroll.payroll_id}</TableCell>
                        <TableCell>{payroll.month}</TableCell>
                        <TableCell>{payroll.days_present}</TableCell>
                        <TableCell>{formatCurrency(payroll.basic_salary)}</TableCell>
                        <TableCell>{formatCurrency(payroll.deductions)}</TableCell>
                        <TableCell>{formatCurrency(payroll.bonus)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payroll.net_pay)}
                        </TableCell>
                        <TableCell>
                          {new Date(payroll.generated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {(user?.role === 'admin' || user?.role === 'accountant') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(payroll)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {user?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(payroll.payroll_id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(payroll.payroll_id)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant' ? 10 : 9} className="text-center py-8 text-gray-500">
                      No payroll records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Payroll Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payroll Record</DialogTitle>
            <DialogDescription>
              Update payroll details for {selectedPayroll?.month}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_days_present">Days Present</Label>
              <Input
                id="edit_days_present"
                type="number"
                value={editFormData.days_present}
                onChange={(e) => setEditFormData({ ...editFormData, days_present: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_basic_salary">Basic Salary (Rs)</Label>
              <Input
                id="edit_basic_salary"
                type="number"
                step="0.01"
                value={editFormData.basic_salary}
                onChange={(e) => setEditFormData({ ...editFormData, basic_salary: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_deductions">Deductions (Rs)</Label>
              <Input
                id="edit_deductions"
                type="number"
                step="0.01"
                value={editFormData.deductions}
                onChange={(e) => setEditFormData({ ...editFormData, deductions: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_bonus">Bonus (Rs)</Label>
              <Input
                id="edit_bonus"
                type="number"
                step="0.01"
                value={editFormData.bonus}
                onChange={(e) => setEditFormData({ ...editFormData, bonus: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Net Pay (Auto-calculated):</p>
              <p className="text-lg font-bold">
                {formatCurrency((editFormData.basic_salary || 0) - (editFormData.deductions || 0) + (editFormData.bonus || 0))}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Payroll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

