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
import { attendanceService, Attendance as AttendanceType } from '@/services/attendance.service'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { LogIn, LogOut } from 'lucide-react'

export default function Attendance() {
  const [attendance, setAttendance] = useState<AttendanceType[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const data = await attendanceService.getToday()
      setAttendance(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch attendance',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn({ employee_id: user?.id || 0 })
      toast({
        title: 'Success',
        description: 'Checked in successfully',
      })
      fetchAttendance()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to check in',
        variant: 'destructive',
      })
    }
  }

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut({ employee_id: user?.id || 0 })
      toast({
        title: 'Success',
        description: 'Checked out successfully',
      })
      fetchAttendance()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to check out',
        variant: 'destructive',
      })
    }
  }

  const getMyAttendance = () => {
    return attendance.find(a => a.employee_id === user?.id)
  }

  const myAttendance = getMyAttendance()
  const canCheckIn = !myAttendance || !myAttendance.check_in
  const canCheckOut = myAttendance?.check_in && !myAttendance.check_out

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-2">Track employee attendance and check-ins</p>
        </div>
        {user?.role !== 'customer' && (
          <div className="flex gap-2">
            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              variant={canCheckIn ? 'default' : 'outline'}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Check In
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              variant={canCheckOut ? 'default' : 'outline'}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          </div>
        )}
      </div>

      {myAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>My Attendance Today</CardTitle>
            <CardDescription>Your attendance record for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Check In</p>
                <p className="text-lg font-semibold">
                  {myAttendance.check_in
                    ? new Date(myAttendance.check_in).toLocaleTimeString()
                    : 'Not checked in'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check Out</p>
                <p className="text-lg font-semibold">
                  {myAttendance.check_out
                    ? new Date(myAttendance.check_out).toLocaleTimeString()
                    : 'Not checked out'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(myAttendance.status)}`}>
                  {myAttendance.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>All attendance records for today</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length > 0 ? (
                  attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.employee_id}</TableCell>
                      <TableCell>
                        {record.check_in
                          ? new Date(record.check_in).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {record.check_out
                          ? new Date(record.check_out).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No attendance records for today
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

