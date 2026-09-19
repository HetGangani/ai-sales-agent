import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';
import { hasPermission, isRoleAtLeast, Permission } from './rbac';
import { MembershipRole, User, Organization } from '@/lib/types/domain';
import { db } from '@/lib/db/repository';
import { AppError } from '@/lib/utils/api-response';

export interface AuthenticatedSession {
  user: User;
  organization: Organization;
  role: MembershipRole;
  tokenPayload: TokenPayload;
}

export interface AuthOptions {
  requiredRole?: MembershipRole;
  requiredPermission?: Permission;
  allowDemoFallback?: boolean;
}

/**
 * Authenticates the incoming HTTP request and returns session context
 */
export async function authenticateRequest(
  req: NextRequest,
  options: AuthOptions = {}
): Promise<AuthenticatedSession> {
  let token: string | null = null;

  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check Cookie
  if (!token) {
    const cookie = req.cookies.get('auth_token');
    if (cookie) {
      token = cookie.value;
    }
  }

  // 3. Fallback demo session in dev if requested
  if (!token && options.allowDemoFallback !== false && process.env.NODE_ENV !== 'production') {
    const adminUser = await db.userRepo.findByEmail('admin@acmetech.com');
    const org = await db.orgRepo.findById('00000000-0000-0000-0000-000000000001');

    if (adminUser && org) {
      return {
        user: adminUser,
        organization: org,
        role: 'ADMIN',
        tokenPayload: {
          userId: adminUser.id,
          email: adminUser.email,
          organizationId: org.id,
          role: 'ADMIN',
          isSuperAdmin: false,
        },
      };
    }
  }

  if (!token) {
    throw new AppError('Authentication required. Missing Bearer token or session cookie.', 'UNAUTHORIZED', 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new AppError('Invalid or expired authentication token.', 'UNAUTHORIZED', 401);
  }

  const user = await db.userRepo.findById(payload.userId);
  if (!user) {
    throw new AppError('Authenticated user no longer exists.', 'UNAUTHORIZED', 401);
  }

  const org = await db.orgRepo.findById(payload.organizationId);
  if (!org) {
    throw new AppError('Organization not found or access revoked.', 'FORBIDDEN', 403);
  }

  const membership = await db.membershipRepo.findByOrgAndUser(org.id, user.id);
  if (!membership) {
    throw new AppError('User is not a member of this organization.', 'FORBIDDEN', 403);
  }

  // Check role requirement
  if (options.requiredRole && !isRoleAtLeast(membership.role, options.requiredRole, user.is_super_admin)) {
    throw new AppError(
      `Insufficient permissions. Requires minimum role: ${options.requiredRole}`,
      'FORBIDDEN',
      403
    );
  }

  // Check granular permission requirement
  if (options.requiredPermission && !hasPermission(membership.role, options.requiredPermission, user.is_super_admin)) {
    throw new AppError(
      `Permission denied for action: ${options.requiredPermission}`,
      'FORBIDDEN',
      403
    );
  }

  return {
    user,
    organization: org,
    role: membership.role,
    tokenPayload: payload,
  };
}
