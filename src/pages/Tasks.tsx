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

/** Roles that can receive an assigned task (matches backend). */
const ASSIGNEE_ROLE_GROUPS = [
  { key: 'worker' as const, label: 'Worker' },
  { key: 'manager' as const, label: 'Manager' },
  { key: 'accountant' as const, label: 'Accountant' },
]

type AssigneesByRole = Record<(typeof ASSIGNEE_ROLE_GROUPS)[number]['key'], User[]>

const EMPTY_ASSIGNEES: AssigneesByRole = { worker: [], manager: [], accountant: [] }

function formatRoleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function AssigneePicker({
  value,
  onChange,
  assigneesByRole,
}: {
  value: number
  onChange: (userId: number) => void
  assigneesByRole: AssigneesByRole
}) {
  const [roleFilter, setRoleFilter] = useState<'all' | 'worker' | 'manager' | 'accountant'>('all')

  const allEligible = ASSIGNEE_ROLE_GROUPS.flatMap((group) =>
    assigneesByRole[group.key].map((u) => ({ user: u, role: group.key, roleLabel: group.label }))
  ).sort((a, b) => a.user.name.localeCompare(b.user.name))

  const filtered =
    roleFilter === 'all'
      ? allEligible
      : allEligible.filter((entry) => entry.role === roleFilter)

  const selected = allEligible.find((entry) => entry.user.id === value)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="assignee-role-filter">Narrow list by role (optional)</Label>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}
        >
          <SelectTrigger id="assignee-role-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="worker">Workers only</SelectItem>
            <SelectItem value="manager">Managers only</SelectItem>
            <SelectItem value="accountant">Accountants only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignee-person">Select one person *</Label>
        <Select
          value={value > 0 ? value.toString() : undefined}
          onValueChange={(v) => onChange(parseInt(v, 10))}
        >
          <SelectTrigger id="assignee-person">
            <SelectValue placeholder="Choose a specific worker, manager, or accountant" />
          </SelectTrigger>
          <SelectContent>
            {filtered.map(({ user, roleLabel }) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name} · {roleLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <p className="text-xs rounded-md border bg-muted/50 px-3 py-2">
          This task will be assigned to{' '}
          <strong>{selected.user.name}</strong> ({selected.roleLabel}){' '}
          <strong>only</strong> — not shared with other workers or roles.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Each task is for <strong>one specific person</strong>. Pick an individual worker,
        manager, or accountant by name.
      </p>

      {allEligible.length === 0 && (
        <p className="text-xs text-destructive">
          No eligible users found. Add workers, managers, or accountants in User Management.
        </p>
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
  const [assigneesByRole, setAssigneesByRole] = useState<AssigneesByRole>(EMPTY_ASSIGNEES)
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
      setAssigneesByRole({
        worker: workers.sort((a, b) => a.name.localeCompare(b.name)),
        manager: managers.sort((a, b) => a.name.localeCompare(b.name)),
        accountant: accountants.sort((a, b) => a.name.localeCompare(b.name)),
      })
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
                    <Label>Assign to one person *</Label>
                    <AssigneePicker
                      value={formData.assigned_to_id}
                      onChange={(assigned_to_id) => setFormData({ ...formData, assigned_to_id })}
                      assigneesByRole={assigneesByRole}
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
                    {canManage && <TableHead>Assigned person</TableHead>}
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
                        <TableCell>{task.assigned_to_name || `#${task.assigned_to_id}`}</TableCell>
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
                <Label>Assign to one person</Label>
                <AssigneePicker
                  value={formData.assigned_to_id}
                  onChange={(assigned_to_id) => setFormData({ ...formData, assigned_to_id })}
                  assigneesByRole={assigneesByRole}
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
