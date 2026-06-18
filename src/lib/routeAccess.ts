/**
 * Route access aligned with Layout.tsx navigation.
 * Users who cannot see a page in the sidebar must not open it via URL.
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  WORKER: 'worker',
  CUSTOMER: 'customer',
} as const

export type AppRole = (typeof ROLES)[keyof typeof ROLES]

export function hasRouteAccess(role: string | undefined, allowedRoles: readonly string[]): boolean {
  return !!role && allowedRoles.includes(role)
}

/** Human-readable label for Access Denied, e.g. "Admin, Manager, or Customer" */
export function formatAllowedRolesLabel(roles: readonly string[]): string {
  const names = roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1))
  if (names.length === 0) return 'Authorized'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} or ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`
}

/** Roles allowed per app route (must match Layout.tsx nav). */
export const ROUTE_ACCESS = {
  orders: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER],
  attendance: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.WORKER],
  payroll: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
  inventory: [ROLES.ADMIN, ROLES.MANAGER],
  aiImage: [ROLES.ADMIN, ROLES.MANAGER],
  notifications: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.WORKER, ROLES.CUSTOMER],
  users: [ROLES.ADMIN],
  analytics: [ROLES.ADMIN],
  settings: [ROLES.ADMIN],
  profile: [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.WORKER, ROLES.CUSTOMER],
} as const
