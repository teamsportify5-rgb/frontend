import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ordersService, Order } from '@/services/orders.service'
import { attendanceService, Attendance } from '@/services/attendance.service'
import { authService, User } from '@/services/auth.service'
import { inventoryService, Inventory } from '@/services/inventory.service'
import { groupOrdersByMonth } from '@/lib/dashboardData'
import { format, parse } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { TrendingUp, Users, Package, Activity } from 'lucide-react'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

export default function Analytics() {
  const [orders, setOrders] = useState<Order[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, attendanceData, usersData, stockData] = await Promise.all([
          ordersService.getAll(),
          attendanceService.getToday(),
          authService.getUsers(),
          inventoryService.getLowStock(),
        ])
        setOrders(ordersData)
        setAttendance(attendanceData)
        setUsers(usersData)
        setLowStockItems(stockData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'In Progress', value: orders.filter(o => o.status === 'in_progress').length },
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length },
    { name: 'Delayed', value: orders.filter(o => o.status === 'delayed').length },
  ]

  const monthlyOrders = useMemo(() => {
    return groupOrdersByMonth(orders).map(({ month, orders: count }) => ({
      month: format(parse(`${month}-01`, 'yyyy-MM-dd', new Date()), 'MMM yyyy'),
      orders: count,
    }))
  }, [orders])

  const roleDistribution = [
    { name: 'Workers', value: users.filter(u => u.role === 'worker').length },
    { name: 'Managers', value: users.filter(u => u.role === 'manager').length },
    { name: 'Accountants', value: users.filter(u => u.role === 'accountant').length },
    { name: 'Customers', value: users.filter(u => u.role === 'customer').length },
  ]

  const attendanceToday = [
    { name: 'Present', value: attendance.filter(a => a.status === 'present').length, color: '#22c55e' },
    { name: 'Absent', value: attendance.filter(a => a.status === 'absent').length, color: '#ef4444' },
    { name: 'Late', value: attendance.filter(a => a.status === 'late').length, color: '#f59e0b' },
  ]

  const totalUsers = users.length
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const workerCount = users.filter(u => u.role === 'worker').length
  const attendanceRate = attendance.length > 0
    ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(1)
    : '0'
  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0'

  const insights = useMemo(() => {
    const items: { title: string; text: string; className: string }[] = [
      {
        title: 'Order completion',
        text: `${completedOrders} of ${totalOrders} orders completed (${completionRate}%). ${pendingOrders} still pending.`,
        className: 'bg-blue-50',
      },
    ]

    if (lowStockItems.length > 0) {
      const names = lowStockItems.slice(0, 4).map(i => i.item).join(', ')
      items.push({
        title: 'Stock alert',
        text: `${lowStockItems.length} item(s) at or below reorder threshold: ${names}${lowStockItems.length > 4 ? '…' : ''}.`,
        className: 'bg-yellow-50',
      })
    }

    items.push({
      title: 'Workforce snapshot',
      text: `${workerCount} workers on record. Today's attendance rate is ${attendanceRate}%.`,
      className: 'bg-green-50',
    })

    return items
  }, [completedOrders, totalOrders, completionRate, pendingOrders, lowStockItems, workerCount, attendanceRate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-muted-foreground">
          Live metrics from orders, attendance, users, and inventory
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">{completedOrders} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Today's attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Order completion</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders Analytics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="ai">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Breakdown by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Order Trends</CardTitle>
                <CardDescription>Orders created per month (from live data)</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No orders recorded yet.</p>
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="orders" stroke="#8884d8" fill="#8884d8" name="Orders" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Present, absent, and late counts for today</CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No attendance records for today.</p>
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceToday}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Employees">
                    {attendanceToday.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Breakdown of users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roleDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operational Insights</CardTitle>
              <CardDescription>Derived from current system data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.title} className={`p-4 border rounded-lg ${insight.className}`}>
                  <h4 className="font-semibold mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
