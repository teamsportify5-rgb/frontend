import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Package, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      // Error handled in auth context
    } finally {
      setLoading(false)
    }
  }

  const openForgotDialog = () => {
    setResetEmail(email.trim())
    setForgotOpen(true)
  }

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Enter the email address for your account.',
        variant: 'destructive',
      })
      return
    }

    setResetSubmitting(true)
    try {
      const result = await authService.requestPasswordReset(resetEmail.trim())
      toast({
        title: 'Request sent',
        description: result.message,
      })
      setForgotOpen(false)
    } catch (error: any) {
      toast({
        title: 'Request failed',
        description: error.response?.data?.detail || 'Could not submit your request. Try again.',
        variant: 'destructive',
      })
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md px-4">
        {/* System Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Package className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Sportify Management System
          </h1>
          <p className="text-muted-foreground">
            Streamline your operations
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      openForgotDialog()
                    }}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-4">
            <p className="text-xs text-center text-muted-foreground">
              Secure access to your Sportify Management dashboard
            </p>
          </CardFooter>
        </Card>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request password reset</DialogTitle>
              <DialogDescription>
                Enter your account email. An administrator will be notified via push notification and can reset your password from User Management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="reset_email">Email address</Label>
              <Input
                id="reset_email"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetSubmitting}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForgotOpen(false)} disabled={resetSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleRequestReset} disabled={resetSubmitting}>
                {resetSubmitting ? 'Sending...' : 'Notify admin'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 Sportify Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
