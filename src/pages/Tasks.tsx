import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { tasksService, Task, CreateTask, UpdateTask, TaskStatus, TaskPriority } from '@/services/tasks.service'
import { authService, User } from '@/services/auth.service'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatApiError } from '@/lib/apiError'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

const STATUS_OPTIONS: TaskStatus[] = ['pending', 'in_progress', 'completed']
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high']

const ELIGIBLE_ASSIGNEE_ROLES = ['worker', 'manager', 'accountant'] as const

function formatRoleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function isEligibleAssignee(user: User) {
  return ELIGIBLE_ASSIGNEE_ROLES.includes(user.role as (typeof ELIGIBLE_ASSIGNEE_ROLES)[number])
}

type AssigneeUser = Pick<User, 'id' | 'name' | 'email' | 'role'>

function AssigneePicker({
  value,
  onChange,
  eligibleUsers,
  loadingUsers,
}: {
  value: number
  onChange: (userId: number) => void
  eligibleUsers: AssigneeUser[]
  loadingUsers: boolean
}) {
  const [roleFilter, setRoleFilter] = useState<'all' | 'worker' | 'manager' | 'accountant'>('all')
  const [search, setSearch] = useState('')

  const byRole =
    roleFilter === 'all'
      ? eligibleUsers
      : eligibleUsers.filter((u) => u.role === roleFilter)

  const searchLower = search.trim().toLowerCase()
  const filtered = searchLower
    ? byRole.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      )
    : byRole

  const selected = eligibleUsers.find((u) => u.id === value)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {loadingUsers
            ? 'Loading users from User Management…'
            : `${eligibleUsers.length} user(s) can be assigned (worker, manager, or accountant role)`}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignee-role-filter">Filter by role</Label>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}
        >
          <SelectTrigger id="assignee-role-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[200]">
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="worker">Worker</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="accountant">Accountant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignee-search">Search by name or email</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="assignee-search"
            className="pl-9"
            placeholder="e.g. manager@sportify.com"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Select user *</Label>
        <div className="rounded-md border max-h-52 overflow-y-auto">
          {loadingUsers ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Loading users…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              {eligibleUsers.length === 0
                ? 'No worker, manager, or accountant users found. Add them under Users.'
                : 'No users match this filter.'}
            </p>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onChange(user.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/80 transition-colors',
                  value === user.id && 'bg-primary/10 ring-1 ring-inset ring-primary'
                )}
              >
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {user.email} · Role: {formatRoleLabel(user.role)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div className="text-xs rounded-md border bg-muted/50 px-3 py-2 space-y-1">
          <p>
            Selected: <strong>{selected.name}</strong>
          </p>
          <p className="text-muted-foreground">
            {selected.email} · Role: {formatRoleLabel(selected.role)}
          </p>
        </div>
      )}
    </div>
  )
}

function priorityBadgeVariant(priority: TaskPriority) {
  if (priority === 'high') return 'destructive'
  if (priority === 'medium') return 'secondary'
  return 'outline'
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [eligibleUsers, setEligibleUsers] = useState<AssigneeUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [formData, setFormData] = useState<CreateTask>({
    title: '',
    description: '',
    assigned_to_id: 0,
    priority: 'medium',
    due_date: '',
  })

  useEffect(() => {
    fetchTasks()
  }, [user])

  const fetchAssignees = async () => {
    setLoadingUsers(true)
    try {
      const users = await tasksService.getAssignees()
      setEligibleUsers(users)
    } catch {
      // Fallback if /tasks/assignees not deployed yet
      try {
        const all = await authService.getUsers()
        setEligibleUsers(
          all
            .filter(isEligibleAssignee)
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: formatApiError(error, 'Failed to load users for assignment'),
          variant: 'destructive',
        })
        setEligibleUsers([])
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  const openCreateDialog = (open: boolean) => {
    setDialogOpen(open)
    if (open && canManage) {
      fetchAssignees()
    }
    if (!open) {
      setFormData({
        title: '',
        description: '',
        assigned_to_id: 0,
        priority: 'medium',
        due_date: '',
      })
    }
  }

  const openEditDialogState = (open: boolean) => {
    setEditDialogOpen(open)
    if (open && canManage) {
      fetchAssignees()
    }
    if (!open) {
      setSelectedTask(null)
    }
  }

  const fetchTasks = async () => {
    try {
      const data = await tasksService.getAll()
      setTasks(data)
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to fetch tasks'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' })
      return
    }
    if (!formData.assigned_to_id) {
      toast({
        title: 'Validation Error',
        description: 'Choose one specific worker, manager, or accountant for this task',
        variant: 'destructive',
      })
      return
    }

    try {
      await tasksService.create({
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        assigned_to_id: formData.assigned_to_id,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
      })
      toast({ title: 'Success', description: 'Task assigned successfully' })
      setDialogOpen(false)
      setFormData({ title: '', description: '', assigned_to_id: 0, priority: 'medium', due_date: '' })
      fetchTasks()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to create task'),
        variant: 'destructive',
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedTask) return

    try {
      const updateData: UpdateTask = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        assigned_to_id: formData.assigned_to_id,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
      }
      await tasksService.update(selectedTask.id, updateData)
      toast({ title: 'Success', description: 'Task updated successfully' })
      setEditDialogOpen(false)
      setSelectedTask(null)
      fetchTasks()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to update task'),
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (taskId: number) => {
    if (!confirm('Delete this task?')) return
    try {
      await tasksService.delete(taskId)
      toast({ title: 'Success', description: 'Task deleted' })
      fetchTasks()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to delete task'),
        variant: 'destructive',
      })
    }
  }

  const updateStatus = async (task: Task, status: TaskStatus) => {
    try {
      await tasksService.update(task.id, { status })
      toast({ title: 'Success', description: 'Task status updated' })
      fetchTasks()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to update status'),
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (task: Task) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      assigned_to_id: task.assigned_to_id,
      priority: task.priority,
      due_date: task.due_date || '',
    })
    setEditDialogOpen(true)
    if (canManage) {
      fetchAssignees()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={
          canManage
            ? 'Assign each task to one specific worker, manager, or accountant'
            : 'Tasks assigned to you personally'
        }
        actions={
          canManage ? (
            <Dialog open={dialogOpen} onOpenChange={openCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Assign New Task</DialogTitle>
                  <DialogDescription>
                    Pick exactly one person by name. The task is not sent to all workers or
                    everyone with that role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Quality check on Order #1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign to user *</Label>
                    <AssigneePicker
                      value={formData.assigned_to_id}
                      onChange={(assigned_to_id) => setFormData({ ...formData, assigned_to_id })}
                      eligibleUsers={eligibleUsers}
                      loadingUsers={loadingUsers}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value as TaskPriority })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate}>Assign Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{canManage ? 'All Tasks' : 'My Tasks'}</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
              title="No tasks yet"
              description={
                canManage
                  ? 'Assign a task to one specific worker, manager, or accountant by name.'
                  : 'You have no tasks assigned to you yet.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    {canManage && <TableHead>User</TableHead>}
                    {canManage && <TableHead>Role</TableHead>}
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {task.description}
                          </p>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <span className="font-medium">
                            {task.assigned_to_name || `User #${task.assigned_to_id}`}
                          </span>
                        </TableCell>
                      )}
                      {canManage && (
                        <TableCell>
                          {task.assigned_to_role ? (
                            <Badge variant="outline">{formatRoleLabel(task.assigned_to_role)}</Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={priorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        {task.due_date
                          ? format(new Date(task.due_date), 'MMM dd, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status}
                          onValueChange={(value) => updateStatus(task, value as TaskStatus)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <Dialog open={editDialogOpen} onOpenChange={openEditDialogState}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to user</Label>
                <AssigneePicker
                  value={formData.assigned_to_id}
                  onChange={(assigned_to_id) => setFormData({ ...formData, assigned_to_id })}
                  eligibleUsers={eligibleUsers}
                  loadingUsers={loadingUsers}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as TaskPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
