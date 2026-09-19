import jwt from 'jsonwebtoken';
import { MembershipRole } from '@/lib/types/domain';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-sales-agent-jwt-super-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: MembershipRole;
  isSuperAdmin?: boolean;
}

/**
 * Signs a new JWT token for an authenticated user session
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
