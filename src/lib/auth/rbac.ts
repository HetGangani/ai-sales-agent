import { MembershipRole } from '@/lib/types/domain';

export type Permission =
  | 'org:manage'
  | 'org:view'
  | 'users:manage'
  | 'users:view'
  | 'business:manage'
  | 'campaigns:manage'
  | 'campaigns:view'
  | 'leads:manage'
  | 'leads:view'
  | 'leads:export'
  | 'leads:import'
  | 'calls:make'
  | 'calls:view'
  | 'analytics:view'
  | 'billing:manage'
  | 'billing:view'
  | 'audit:view'
  | 'security:manage'
  | 'admin:access';

export const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]> = {
  ADMIN: [
    'org:manage',
    'org:view',
    'users:manage',
    'users:view',
    'business:manage',
    'campaigns:manage',
    'campaigns:view',
    'leads:manage',
    'leads:view',
    'leads:export',
    'leads:import',
    'calls:make',
    'calls:view',
    'analytics:view',
    'billing:manage',
    'billing:view',
    'audit:view',
    'security:manage',
    'admin:access',
  ],
  MANAGER: [
    'org:view',
    'users:view',
    'business:manage',
    'campaigns:manage',
    'campaigns:view',
    'leads:manage',
    'leads:view',
    'leads:export',
    'leads:import',
    'calls:make',
    'calls:view',
    'analytics:view',
    'billing:view',
  ],
  USER: [
    'org:view',
    'campaigns:view',
    'leads:view',
    'leads:manage', // for updating assigned lead status
    'calls:make',
    'calls:view',
    'analytics:view',
  ],
};

/**
 * Checks if a specific role has the requested permission
 */
export function hasPermission(role: MembershipRole, permission: Permission, isSuperAdmin: boolean = false): boolean {
  if (isSuperAdmin) return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a role is at or above the minimum required role
 */
export function isRoleAtLeast(currentRole: MembershipRole, requiredRole: MembershipRole, isSuperAdmin: boolean = false): boolean {
  if (isSuperAdmin) return true;
  const hierarchy: Record<MembershipRole, number> = {
    ADMIN: 3,
    MANAGER: 2,
    USER: 1,
  };
  return (hierarchy[currentRole] || 0) >= (hierarchy[requiredRole] || 0);
}
