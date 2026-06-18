export const DASHBOARD_ROLE_SLUGS = [
  'admin',
  'manager',
  'accountant',
  'worker',
  'customer',
] as const

export type DashboardRoleSlug = (typeof DASHBOARD_ROLE_SLUGS)[number]

export function getDashboardPathForRole(role: string | undefined): string {
  if (role && DASHBOARD_ROLE_SLUGS.includes(role as DashboardRoleSlug)) {
    return `/dashboard/${role}`
  }
  return '/dashboard/admin'
}

export function isDashboardRoleSlug(slug: string): slug is DashboardRoleSlug {
  return DASHBOARD_ROLE_SLUGS.includes(slug as DashboardRoleSlug)
}
