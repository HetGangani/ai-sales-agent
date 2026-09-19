import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/schemas/auth';
import { authService } from '@/lib/services/auth-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`login:${ip}`, { limit: 15, windowMs: 60000 });
    if (!rateCheck.allowed) {
      return apiError('Too many login attempts. Please wait a minute.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const json = await req.json();
    const validated = loginSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const result = await authService.login(validated.data, ip);

    const response = apiSuccess(result, 200);
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
