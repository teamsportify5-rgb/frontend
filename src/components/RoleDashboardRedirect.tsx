import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPathForRole } from '@/lib/dashboardRoutes'

/** Send /dashboard to the signed-in user's role dashboard URL. */
export function RoleDashboardRedirect() {
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

  return <Navigate to={getDashboardPathForRole(user?.role)} replace />
}
