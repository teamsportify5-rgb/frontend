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

const STATUS_OPTIONS: TaskStatus[] = ['pending', 'in_progress', 'completed']
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high']

function priorityBadgeVariant(priority: TaskPriority) {
  if (priority === 'high') return 'destructive'
  if (priority === 'medium') return 'secondary'
  return 'outline'
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignees, setAssignees] = useState<User[]>([])
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
    if (canManage) {
      fetchAssignees()
    }
  }, [user, canManage])

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

  const fetchAssignees = async () => {
    try {
      const [workers, managers, accountants] = await Promise.all([
        authService.getUsers('worker'),
        authService.getUsers('manager'),
        authService.getUsers('accountant'),
      ])
      const byId = new Map<number, User>()
      ;[...workers, ...managers, ...accountants].forEach((u) => byId.set(u.id, u))
      setAssignees(Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to fetch users'),
        variant: 'destructive',
      })
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' })
      return
    }
    if (!formData.assigned_to_id) {
      toast({ title: 'Validation Error', description: 'Please select an assignee', variant: 'destructive' })
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
            ? 'Assign and track work for your team'
            : 'Tasks assigned to you'
        }
        actions={
          canManage ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign New Task</DialogTitle>
                  <DialogDescription>Create a task and assign it to a team member</DialogDescription>
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
                    <Label>Assign to *</Label>
                    <Select
                      value={formData.assigned_to_id > 0 ? formData.assigned_to_id.toString() : undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assigned_to_id: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignees.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.name} ({a.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  ? 'Assign a task to a worker, manager, or accountant.'
                  : 'You have no assigned tasks.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    {canManage && <TableHead>Assigned To</TableHead>}
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
                        <TableCell>{task.assigned_to_name || `#${task.assigned_to_id}`}</TableCell>
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
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
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
                <Label>Assign to</Label>
                <Select
                  value={formData.assigned_to_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_to_id: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignees.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name} ({a.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
