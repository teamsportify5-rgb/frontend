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
import { Link } from 'react-router-dom'
import { attendanceService, Attendance } from '@/services/attendance.service'
import { tasksService, Task } from '@/services/tasks.service'
import { ordersService, Order } from '@/services/orders.service'
import { authService, User } from '@/services/auth.service'
import { inventoryService, Inventory } from '@/services/inventory.service'
import { mapInventoryToStockAlert } from '@/lib/dashboardData'
import {
  Users,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts'

export default function ManagerDashboard() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [workers, setWorkers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceData, ordersData, workersData, tasksData, stockData] = await Promise.all([
          attendanceService.getToday(),
          ordersService.getAll(),
          authService.getUsers('worker'),
          tasksService.getAll(),
          inventoryService.getLowStock(),
        ])
        setAttendance(attendanceData)
        setOrders(ordersData)
        setWorkers(workersData)
        setTasks(tasksData)
        setLowStockItems(stockData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Attendance Summary
  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const lateCount = attendance.filter(a => a.status === 'late').length
  const totalEmployees = workers.length
  const attendanceRate = totalEmployees > 0 ? ((presentCount / totalEmployees) * 100).toFixed(1) : '0'

  // Order Production Progress
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const delayedOrders = orders.filter(o => o.status === 'delayed').length

  const stockAlerts = lowStockItems.map(mapInventoryToStockAlert)

  const workerPerformance = workers.slice(0, 8).map(worker => {
    const assigned = tasks.filter(t => t.assigned_to_id === worker.id)
    const completed = assigned.filter(t => t.status === 'completed').length
    const inProgress = assigned.filter(t => t.status === 'in_progress').length
    return {
      name: worker.name.split(' ')[0],
      tasksCompleted: completed,
      tasksInProgress: inProgress,
      completionRate: assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 0,
    }
  })

  // Attendance Chart Data
  const attendanceChartData = [
    { name: 'Present', value: presentCount, color: '#22c55e' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of operations, attendance, and production
        </p>
      </div>

      {/* Attendance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Active workforce
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <p className="text-xs text-muted-foreground">
              {attendanceRate}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <p className="text-xs text-muted-foreground">
              Not present today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
            <p className="text-xs text-muted-foreground">
              Arrived late today
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Breakdown of employee attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {attendanceChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Production Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Order Production Status</CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Pending</span>
                </div>
                <Badge variant="outline">{pendingOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">In Progress</span>
                </div>
                <Badge variant="secondary">{inProgressOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Completed</span>
                </div>
                <Badge variant="default">{completedOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Delayed</span>
                </div>
                <Badge variant="destructive">{delayedOrders}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Level Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Stock Level Alerts
          </CardTitle>
          <CardDescription>Items requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          {stockAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              All inventory items are above their reorder thresholds.{' '}
              <Link to="/inventory" className="text-primary underline">
                View inventory
              </Link>
            </p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.item}</TableCell>
                  <TableCell>{alert.current} {alert.unit}</TableCell>
                  <TableCell>{alert.threshold} {alert.unit}</TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.status === 'critical' ? 'Critical' : 'Low'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/inventory">Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Tasks & Activities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tasks & Activities</CardTitle>
            <CardDescription>
              Each task is assigned to one specific person (worker, manager, or accountant)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/tasks">Manage Tasks</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tasks yet.{' '}
              <Link to="/tasks" className="text-primary underline">
                Assign a task
              </Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assigned person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.slice(0, 8).map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.assigned_to_name || `#${task.assigned_to_id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {task.assigned_to_role
                          ? task.assigned_to_role.charAt(0).toUpperCase() + task.assigned_to_role.slice(1)
                          : '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {task.priority}
                      </Badge>
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
          )}
        </CardContent>
      </Card>

      {/* Worker Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Performance</CardTitle>
          <CardDescription>Task completion by worker</CardDescription>
        </CardHeader>
        <CardContent>
          {workerPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No worker task data available yet.
            </p>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workerPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasksCompleted" fill="#22c55e" name="Completed" />
              <Bar dataKey="tasksInProgress" fill="#3b82f6" name="In Progress" />
              <Bar dataKey="completionRate" fill="#8884d8" name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

