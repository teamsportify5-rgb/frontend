import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ordersService, Order } from '@/services/orders.service'
import { ArrowLeft, Package, Calendar, Hash, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return
      try {
        const data = await ordersService.getById(parseInt(id))
        setOrder(data)
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'delayed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Generate timeline based on order status and dates
  const getTimeline = () => {
    if (!order) return []
    
    const timeline = []
    
    // Order Created
    timeline.push({
      status: 'created',
      title: 'Order Created',
      description: 'Your order was placed',
      date: order.created_at,
      icon: <FileText className="h-4 w-4" />,
      completed: true,
    })

    // Order Confirmed (if pending or beyond)
    if (order.status !== 'pending') {
      timeline.push({
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Order has been confirmed and is being processed',
        date: order.created_at, // Approximate
        icon: <CheckCircle2 className="h-4 w-4" />,
        completed: true,
      })
    }

    // In Progress
    if (order.status === 'in_progress' || order.status === 'completed' || order.status === 'delayed') {
      timeline.push({
        status: 'in_progress',
        title: 'In Production',
        description: 'Your order is currently being manufactured',
        date: order.created_at, // Approximate
        icon: <Package className="h-4 w-4" />,
        completed: order.status === 'completed',
        active: order.status === 'in_progress',
      })
    }

    // Completed
    if (order.status === 'completed') {
      timeline.push({
        status: 'completed',
        title: 'Order Completed',
        description: 'Your order has been completed and is ready',
        date: order.created_at, // Approximate
        icon: <CheckCircle2 className="h-4 w-4" />,
        completed: true,
      })
    }

    // Delayed (if applicable)
    if (order.status === 'delayed') {
      timeline.push({
        status: 'delayed',
        title: 'Order Delayed',
        description: 'There is a delay in processing your order',
        date: order.due_date || order.created_at,
        icon: <AlertCircle className="h-4 w-4" />,
        completed: false,
        active: true,
      })
    }

    return timeline
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading order details...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Order not found</div>
          <Button onClick={() => navigate('/orders')} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const timeline = getTimeline()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Details</h2>
          <p className="text-muted-foreground">
            Order #{order.order_id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Details about your order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Order ID</span>
              </div>
              <span className="text-sm">#{order.order_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Product</span>
              </div>
              <span className="text-sm">{order.product}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Quantity</span>
              </div>
              <span className="text-sm">{order.quantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge variant={getStatusVariant(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            {order.due_date && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Due Date</span>
                </div>
                <span className="text-sm">
                  {format(new Date(order.due_date), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <span className="text-sm">
                {format(new Date(order.created_at), 'MMM dd, yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
            <CardDescription>Track your order progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        item.completed
                          ? 'bg-green-100 text-green-600'
                          : item.active
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    {index < timeline.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${
                          item.completed ? 'bg-green-200' : 'bg-gray-200'
                        }`}
                        style={{ minHeight: '40px' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{item.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



