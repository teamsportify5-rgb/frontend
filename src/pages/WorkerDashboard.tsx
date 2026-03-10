import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { attendanceService, Attendance } from '@/services/attendance.service'
import { payrollService, Payroll } from '@/services/payroll.service'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  Download
} from 'lucide-react'
import { format } from 'date-fns'

export default function WorkerDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([])
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return
    
    try {
      const [attendanceData, payrollData, todayData] = await Promise.all([
        attendanceService.getByEmployee(user.id),
        payrollService.getByEmployee(user.id),
        attendanceService.getToday(),
      ])
      
      setAttendance(attendanceData)
      setPayrollRecords(payrollData)
      
      // Find today's attendance for current user
      const today = todayData.find(a => a.employee_id === user.id)
      setTodayAttendance(today || null)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!user) return
    
    setCheckingIn(true)
    try {
      await attendanceService.checkIn({ employee_id: user.id })
      toast({
        title: 'Success',
        description: 'Checked in successfully',
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to check in',
        variant: 'destructive',
      })
    } finally {
      setCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    if (!user) return
    
    setCheckingOut(true)
    try {
      await attendanceService.checkOut({ employee_id: user.id })
      toast({
        title: 'Success',
        description: 'Checked out successfully',
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to check out',
        variant: 'destructive',
      })
    } finally {
      setCheckingOut(false)
    }
  }

  const handleDownloadSlip = async (payrollId: number) => {
    try {
      const blob = await payrollService.downloadSlip(payrollId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `salary-slip-${payrollId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: 'Success',
        description: 'Salary slip downloaded',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download salary slip',
        variant: 'destructive',
      })
    }
  }

  // Mock assigned tasks (would come from tasks API)
  const assignedTasks = [
    { id: 1, task: 'Quality check on Order #1234', status: 'in_progress', dueDate: '2024-01-15' },
    { id: 2, task: 'Machine maintenance - Line 2', status: 'pending', dueDate: '2024-01-16' },
    { id: 3, task: 'Inventory count - Warehouse A', status: 'completed', dueDate: '2024-01-14' },
  ]

  const canCheckIn = !todayAttendance || !todayAttendance.check_in
  const canCheckOut = todayAttendance?.check_in && !todayAttendance?.check_out

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Worker Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome, {user?.name}
        </p>
      </div>

      {/* Check In/Out Card */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>Check in and check out for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Today's Status</p>
                  <p className="text-xs text-muted-foreground">
                    {todayAttendance?.check_in
                      ? `Checked in at ${format(new Date(todayAttendance.check_in), 'HH:mm')}`
                      : 'Not checked in'}
                    {todayAttendance?.check_out &&
                      ` • Checked out at ${format(new Date(todayAttendance.check_out), 'HH:mm')}`}
                  </p>
                </div>
              </div>
              <Badge variant={todayAttendance?.status === 'present' ? 'default' : 'outline'}>
                {todayAttendance?.status || 'Not checked in'}
              </Badge>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCheckIn}
                disabled={!canCheckIn || checkingIn}
                className="flex-1"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {checkingIn ? 'Checking In...' : 'Check In'}
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={!canCheckOut || checkingOut}
                variant="outline"
                className="flex-1"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {checkingOut ? 'Checking Out...' : 'Check Out'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Tasks</CardTitle>
          <CardDescription>Tasks assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedTasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.task}</TableCell>
                    <TableCell>
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks assigned</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your recent attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length > 0 ? (
              <div className="space-y-3">
                {attendance.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.check_in &&
                            `In: ${format(new Date(record.check_in), 'HH:mm')}`}
                          {record.check_out &&
                            ` • Out: ${format(new Date(record.check_out), 'HH:mm')}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      record.status === 'present' ? 'default' :
                      record.status === 'late' ? 'secondary' : 'destructive'
                    }>
                      {record.status}
                    </Badge>
                  </div>
                ))}
                {attendance.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Showing last 5 records. Total: {attendance.length}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attendance records</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Slips */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Slips</CardTitle>
            <CardDescription>Your payroll records</CardDescription>
          </CardHeader>
          <CardContent>
            {payrollRecords.length > 0 ? (
              <div className="space-y-3">
                {payrollRecords.map((payroll) => (
                  <div
                    key={payroll.payroll_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{payroll.month}</p>
                      <p className="text-xs text-muted-foreground">
                        Net Pay: ${payroll.net_pay.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSlip(payroll.payroll_id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No salary slips available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendance.filter(a => a.status === 'present').length}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedTasks.filter(t => t.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {assignedTasks.length} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary Slips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              Available records
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



