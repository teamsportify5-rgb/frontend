import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AccessDenied } from '@/components/AccessDenied'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  /** Human-readable label for the denied message, e.g. "Manager" */
  roleLabel?: string
}

export function RoleProtectedRoute({ children, allowedRoles, roleLabel }: RoleProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    const label =
      roleLabel ||
      (allowedRoles.length === 1
        ? allowedRoles[0].charAt(0).toUpperCase() + allowedRoles[0].slice(1)
        : allowedRoles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', '))
    return <AccessDenied requiredRole={label} />
  }

  return <>{children}</>
}



