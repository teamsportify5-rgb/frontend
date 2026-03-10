import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bell, Send, Users, User as UserIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { notificationsService } from '@/services/notifications.service'
import { useAuth } from '@/contexts/AuthContext'
import { authService, User } from '@/services/auth.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Notifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'user'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canSendNotifications = isAdmin || isManager

  const fetchUsers = async () => {
    if (targetType === 'user' && users.length === 0) {
      setLoadingUsers(true)
      try {
        const data = await authService.getUsers()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive',
        })
      } finally {
        setLoadingUsers(false)
      }
    }
  }

  const handleTargetTypeChange = (value: string) => {
    setTargetType(value as 'all' | 'user')
    if (value === 'user') {
      fetchUsers()
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !body.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and body',
        variant: 'destructive',
      })
      return
    }

    if (targetType === 'user' && !selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      if (targetType === 'all') {
        if (!isAdmin) {
          toast({
            title: 'Error',
            description: 'Only admin can send notifications to all users',
            variant: 'destructive',
          })
          return
        }
        await notificationsService.notifyAll({ title, body })
        toast({
          title: 'Success',
          description: 'Notification sent to all users',
        })
      } else {
        await notificationsService.notifyUser(parseInt(selectedUserId), { title, body })
        toast({
          title: 'Success',
          description: 'Notification sent successfully',
        })
      }
      // Reset form
      setTitle('')
      setBody('')
      setSelectedUserId('')
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send notification',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canSendNotifications) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            You don't have permission to send notifications.
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Only administrators and managers can send notifications.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send Notifications</h1>
        <p className="text-muted-foreground">
          Send push notifications to users via Firebase Cloud Messaging
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>New Notification</CardTitle>
          </div>
          <CardDescription>
            {isAdmin
              ? 'Send notifications to all users or a specific user'
              : 'Send notifications to specific users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetType">Target</Label>
              <Select
                value={targetType}
                onValueChange={handleTargetTypeChange}
                disabled={!isAdmin}
              >
                <SelectTrigger id="targetType">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && (
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Users
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Specific User
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === 'user' && (
              <div className="space-y-2">
                <Label htmlFor="userId">Select User</Label>
                {loadingUsers ? (
                  <div className="text-sm text-muted-foreground">Loading users...</div>
                ) : (
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name} ({u.email}) - {u.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="e.g., Order Completed"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Notification Body</Label>
              <Textarea
                id="body"
                placeholder="Enter the notification message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Notifications are sent via Firebase Cloud Messaging (FCM)
          </p>
          <p>
            • Users need to have the mobile app installed and FCM token registered
          </p>
          <p>
            • Only administrators can send notifications to all users
          </p>
          <p>
            • Managers can send notifications to specific users
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

