import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { getDashboardPathForRole } from '@/lib/dashboardRoutes'

type AccessDeniedProps = {
  requiredRole?: string
  title?: string
  message?: string
}

export function AccessDenied({
  requiredRole,
  title = 'Access Denied',
  message,
}: AccessDeniedProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="rounded-full bg-red-50 p-4 mb-4">
        <ShieldAlert className="h-10 w-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-3 max-w-md">
        {message ?? (
          <>
            You are logged in as <span className="font-semibold capitalize">{user?.role}</span>.
            {requiredRole ? (
              <>
                {' '}
                This page is only available to <span className="font-semibold">{requiredRole}</span> accounts.
              </>
            ) : (
              ' You do not have permission to view this page.'
            )}
          </>
        )}
      </p>
      <Button
        className="mt-6"
        onClick={() => navigate(getDashboardPathForRole(user?.role))}
      >
        Go to your dashboard
      </Button>
    </div>
  )
}
