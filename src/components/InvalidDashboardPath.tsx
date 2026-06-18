import { useAuth } from '@/contexts/AuthContext'
import { AccessDenied } from '@/components/AccessDenied'

/** Shown for unknown dashboard URLs such as /dashboard/user */
export function InvalidDashboardPath() {
  const { user } = useAuth()

  return (
    <AccessDenied
      title="Invalid dashboard URL"
      message={`You are logged in as ${user?.role ?? 'a user'}. That dashboard link does not exist. Use the button below to open your dashboard.`}
    />
  )
}
