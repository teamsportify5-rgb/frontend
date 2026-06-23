import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { payrollService, Payroll } from '@/services/payroll.service'
import { groupPayrollByMonth } from '@/lib/dashboardData'
import { useToast } from '@/hooks/use-toast'
import {
  DollarSign,
  Download,
  Calculator,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, parse } from 'date-fns'

export default function AccountantDashboard() {
  const [employees, setEmployees] = useState<{ id: number; name: string; email: string; role: string }[]>([])
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesData, payrollData] = await Promise.all([
          payrollService.getEmployees(),
          payrollService.getAll(),
        ])
        setEmployees(employeesData)
        setPayrollRecords(payrollData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load payroll data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGeneratePayroll = async () => {
    if (!selectedEmployee) {
      toast({
        title: 'Validation Error',
        description: 'Please select an employee',
        variant: 'destructive',
      })
      return
    }

    try {
      const month = selectedMonth || format(new Date(), 'yyyy-MM')
      await payrollService.generate(selectedEmployee, { month })
      toast({
        title: 'Success',
        description: 'Payroll generated successfully',
      })
      setGenerateDialogOpen(false)
      setSelectedEmployee(null)
      setSelectedMonth('')
      
      const payrollData = await payrollService.getAll()
      setPayrollRecords(payrollData)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate payroll',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadSlip = async (payrollId: number) => {
    try {
      const blob = await payrollService.downloadSlip(payrollId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll-slip-${payrollId}.pdf`
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
        description: 'Failed to download payroll slip',
        variant: 'destructive',
      })
    }
  }

  // Calculate totals
  const totalBasicSalary = payrollRecords.reduce((sum, p) => sum + p.basic_salary, 0)
  const totalDeductions = payrollRecords.reduce((sum, p) => sum + p.deductions, 0)
  const totalBonus = payrollRecords.reduce((sum, p) => sum + p.bonus, 0)
  const totalNetPay = payrollRecords.reduce((sum, p) => sum + p.net_pay, 0)

  const monthlyData = groupPayrollByMonth(payrollRecords).map((row) => ({
    ...row,
    month: format(parse(`${row.month}-01`, 'yyyy-MM-dd', new Date()), 'MMM yyyy'),
  }))

  // Get current month
  const currentMonth = format(new Date(), 'yyyy-MM')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading payroll data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accountant Dashboard</h2>
          <p className="text-muted-foreground">
            Manage payroll, salaries, and financial records
          </p>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calculator className="mr-2 h-4 w-4" />
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
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={selectedEmployee?.toString() || ''}
                  onValueChange={(value) => setSelectedEmployee(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} ({emp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth || currentMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGeneratePayroll}>Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              Active employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Basic Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBasicSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All payroll records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalDeductions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalNetPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              After deductions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Payroll Report Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Payroll Report</CardTitle>
          <CardDescription>Payroll trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No payroll records yet. Generate payroll to see trends.
            </p>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="Total Salary" />
              <Bar dataKey="deductions" fill="#ef4444" name="Deductions" />
              <Bar dataKey="net" fill="#22c55e" name="Net Pay" />
            </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Employee Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Salary Records</CardTitle>
          <CardDescription>Detailed payroll information for all employees</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Days Present</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords.length > 0 ? (
                payrollRecords.map((payroll) => {
                  const employee = employees.find(e => e.id === payroll.employee_id)
                  return (
                    <TableRow key={payroll.payroll_id}>
                      <TableCell className="font-medium">
                        {employee?.name || `Employee #${payroll.employee_id}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {payroll.month}
                        </div>
                      </TableCell>
                      <TableCell>${payroll.basic_salary.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-green-600">+${payroll.bonus.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600">-${payroll.deductions.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>{payroll.days_present}</TableCell>
                      <TableCell className="font-semibold">
                        ${payroll.net_pay.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSlip(payroll.payroll_id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Slip
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payroll records found. Generate payroll for employees.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Allowances & Deductions Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bonus Summary</CardTitle>
            <CardDescription>Total bonus across all payroll records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Bonus</span>
              <span className="font-bold text-green-600 text-lg">
                ${totalBonus.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deductions Summary</CardTitle>
            <CardDescription>Total deductions across all payroll records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Deductions</span>
              <span className="font-bold text-red-600 text-lg">
                ${totalDeductions.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



