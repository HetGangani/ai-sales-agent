import { RegisterInput, LoginInput } from '@/lib/schemas/auth';
import { db } from '@/lib/db/repository';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';
import { trackFailedLogin, resetFailedLogins } from '@/lib/security/fraud-detector';
import { User, Organization, MembershipRole, PlanTier } from '@/lib/types/domain';

function toSafeUser(user: User): Omit<User, 'password_hash'> {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    is_super_admin: user.is_super_admin,
    created_at: user.created_at,
  };
}

export class AuthService {
  /**
   * Registers a new organization and root admin user
   */
  async register(input: RegisterInput, ipAddress?: string): Promise<{
    user: Omit<User, 'password_hash'>;
    organization: Organization;
    role: MembershipRole;
    token: string;
  }> {
    const existingUser = await db.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new AppError('An account with this email already exists', 'CONFLICT', 409);
    }

    // Generate slug from company name
    const baseSlug = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Organization
    const organization: Organization = {
      id: crypto.randomUUID(),
      name: input.companyName,
      slug,
      plan_tier: input.planTier as PlanTier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.orgRepo.create(organization);

    // 2. Create User
    const passwordHash = await hashPassword(input.password);
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      password_hash: passwordHash,
      avatar_url: null,
      is_super_admin: false,
      created_at: new Date().toISOString(),
    };
    await db.userRepo.create(user);

    // 3. Create Admin Membership
    await db.membershipRepo.create({
      id: crypto.randomUUID(),
      organization_id: organization.id,
      user_id: user.id,
      role: 'ADMIN',
      created_at: new Date().toISOString(),
    });

    // 4. Create Initial Business Profile
    await db.businessProfileRepo.createOrUpdate({
      id: crypto.randomUUID(),
      organization_id: organization.id,
      company_name: input.companyName,
      website_url: input.websiteUrl || 'https://' + slug + '.com',
      industry: 'General Enterprise',
      company_size: '10-50 employees',
      overview: `${input.companyName} commercial profile.`,
      target_icp: {},
      ai_summary: null,
      created_at: new Date().toISOString(),
    });

    // 5. Create Subscription
    await db.subscriptionRepo.createOrUpdate({
      id: crypto.randomUUID(),
      organization_id: organization.id,
      plan_tier: input.planTier as PlanTier,
      status: 'ACTIVE',
      allocated_voice_minutes: input.planTier === 'ENTERPRISE' ? 5000 : input.planTier === 'GROWTH' ? 2000 : 500,
      used_voice_minutes: 0,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 6. Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      organizationId: organization.id,
      role: 'ADMIN',
      isSuperAdmin: false,
    });

    // 7. Audit Log
    await logAuditEvent({
      organizationId: organization.id,
      userId: user.id,
      action: 'register',
      resourceType: 'auth',
      resourceId: user.id,
      details: { email: user.email, companyName: organization.name, planTier: organization.plan_tier },
      ipAddress,
    });

    return {
      user: toSafeUser(user),
      organization,
      role: 'ADMIN',
      token,
    };
  }

  /**
   * Logs in an existing user
   */
  async login(input: LoginInput, ipAddress?: string): Promise<{
    user: Omit<User, 'password_hash'>;
    organization: Organization;
    role: MembershipRole;
    token: string;
  }> {
    const user = await db.userRepo.findByEmail(input.email);
    if (!user || !user.password_hash) {
      if (ipAddress) await trackFailedLogin(input.email, ipAddress);
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      if (ipAddress) await trackFailedLogin(input.email, ipAddress);
      await logAuditEvent({
        userId: user.id,
        action: 'login_failed',
        resourceType: 'auth',
        resourceId: user.id,
        details: { email: input.email },
        ipAddress,
      });
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Reset failed login count
    if (ipAddress) resetFailedLogins(input.email, ipAddress);

    // Get primary organization membership
    const memberships = await db.membershipRepo.findByUser(user.id);
    if (memberships.length === 0) {
      throw new AppError('No organization membership found for this user', 'FORBIDDEN', 403);
    }

    const primaryMembership = memberships[0];
    const organization = await db.orgRepo.findById(primaryMembership.organization_id);
    if (!organization) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      organizationId: organization.id,
      role: primaryMembership.role,
      isSuperAdmin: user.is_super_admin,
    });

    await logAuditEvent({
      organizationId: organization.id,
      userId: user.id,
      action: 'login',
      resourceType: 'auth',
      resourceId: user.id,
      details: { email: user.email },
      ipAddress,
    });

    return {
      user: toSafeUser(user),
      organization,
      role: primaryMembership.role,
      token,
    };
  }

  /**
   * Retrieves profile details for active session
   */
  async getMe(userId: string, orgId: string): Promise<{
    user: Omit<User, 'password_hash'>;
    organization: Organization;
    role: MembershipRole;
    permissions: string[];
  }> {
    const user = await db.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }

    const org = await db.orgRepo.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    const membership = await db.membershipRepo.findByOrgAndUser(orgId, userId);
    if (!membership) {
      throw new AppError('Membership not found', 'FORBIDDEN', 403);
    }

    return {
      user: toSafeUser(user),
      organization: org,
      role: membership.role,
      permissions: ['leads:view', 'campaigns:view', 'calls:make'],
    };
  }
}

export const authService = new AuthService();
