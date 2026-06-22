import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { authService } from '@/services/auth.service'
import { PageHeader } from '@/components/PageHeader'
import { formatApiError } from '@/lib/apiError'
import { isSportifyCompanyEmail, SPORTIFY_EMAIL_ERROR } from '@/lib/apiError'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'New password must be at least 6 characters.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    setChanging(true)
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      await refreshUser()
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to change password'),
        variant: 'destructive',
      })
    } finally {
      setChanging(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSportifyCompanyEmail(newEmail)) {
      toast({
        title: 'Invalid email',
        description: SPORTIFY_EMAIL_ERROR,
        variant: 'destructive',
      })
      return
    }

    setChangingEmail(true)
    try {
      const result = await authService.changeEmail({
        new_email: newEmail.trim(),
        password: emailPassword,
      })
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('user', JSON.stringify(result.user))
      await refreshUser()
      setNewEmail('')
      setEmailPassword('')
      toast({
        title: 'Email updated',
        description: result.message,
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: formatApiError(error, 'Failed to change email'),
        variant: 'destructive',
      })
    } finally {
      setChangingEmail(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="View account details, change email, or update your password"
      />

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input value={user.name} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input value={user.phone || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </Label>
              <Input
                value={user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user.role} disabled className="bg-muted capitalize" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Change email
          </CardTitle>
          <CardDescription>
            New email must be <strong>@sportify.com</strong>. Enter your password to confirm.
            Admins can also change user emails from User Management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="new_email">New email address</Label>
              <Input
                id="new_email"
                type="email"
                placeholder="you@sportify.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={changingEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_password">Current password</Label>
              <Input
                id="email_password"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                disabled={changingEmail}
              />
            </div>
            <Button type="submit" disabled={changingEmail}>
              {changingEmail ? 'Updating...' : 'Update email'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change password
          </CardTitle>
          <CardDescription>
            {user.must_change_password
              ? 'You must set a new password before continuing to use the app.'
              : 'Update your password regularly for security.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current password</Label>
              <Input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={changing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={changing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={changing}
              />
            </div>
            <Button type="submit" disabled={changing}>
              {changing ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
