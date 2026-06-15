import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, Users, User as UserIcon, CheckCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { notificationsService, NotificationLog } from '@/services/notifications.service'
import { useAuth } from '@/contexts/AuthContext'
import { authService, User } from '@/services/auth.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'

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
  const [history, setHistory] = useState<NotificationLog[]>([])
  const [historyScope, setHistoryScope] = useState<'mine' | 'all'>('mine')
  const [loadingHistory, setLoadingHistory] = useState(true)

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canSendNotifications = isAdmin || isManager

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const scope = isAdmin && historyScope === 'all' ? 'all' : 'mine'
      const data = await notificationsService.getHistory(scope)
      setHistory(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to load notification history',
        variant: 'destructive',
      })
    } finally {
      setLoadingHistory(false)
    }
  }, [historyScope, isAdmin, toast])

  const fetchUsers = useCallback(async () => {
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
  }, [toast])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (targetType === 'user' && canSendNotifications) {
      fetchUsers()
    }
  }, [targetType, canSendNotifications, fetchUsers])

  const handleTargetTypeChange = (value: string) => {
    setTargetType(value as 'all' | 'user')
    if (value !== 'user') {
      setSelectedUserId('')
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
      setTitle('')
      setBody('')
      setSelectedUserId('')
      fetchHistory()
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

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsService.markRead(id)
      fetchHistory()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not mark as read',
        variant: 'destructive',
      })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead()
      fetchHistory()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not mark all as read',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          {canSendNotifications
            ? 'Send alerts and view notification history'
            : 'Your notification inbox'}
        </p>
      </div>

      {canSendNotifications && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Send notification</CardTitle>
            </div>
            <CardDescription>
              {isAdmin
                ? 'Send to all users or a specific user'
                : 'Send to a specific user'}
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
                  ) : users.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No users found.</div>
                  ) : (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
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
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Notification history</CardTitle>
              <CardDescription>
                Past alerts stay here even after push notifications disappear from your device
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <Select
                  value={historyScope}
                  onValueChange={(v) => setHistoryScope(v as 'mine' | 'all')}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">My inbox</SelectItem>
                    <SelectItem value="all">All users</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="py-8 text-center text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No notifications yet</div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 ${item.is_read ? 'bg-muted/30' : 'bg-background'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{item.title}</p>
                        {!item.is_read && <Badge variant="secondary">New</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                        {item.notification_type !== 'general' && ` · ${item.notification_type}`}
                      </p>
                    </div>
                    {!item.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(item.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
