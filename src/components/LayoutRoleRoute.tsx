import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'
import Layout from '@/components/Layout'
import { formatAllowedRolesLabel } from '@/lib/routeAccess'

interface LayoutRoleRouteProps {
  children: React.ReactNode
  allowedRoles: readonly string[]
  /** Override Access Denied message role label */
  roleLabel?: string
}

/** Authenticated layout with role check — shows Access Denied inside the shell. */
export function LayoutRoleRoute({ children, allowedRoles, roleLabel }: LayoutRoleRouteProps) {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleProtectedRoute
          allowedRoles={[...allowedRoles]}
          roleLabel={roleLabel ?? formatAllowedRolesLabel(allowedRoles)}
        >
          {children}
        </RoleProtectedRoute>
      </Layout>
    </ProtectedRoute>
  )
}
