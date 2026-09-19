import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { businessService } from '@/lib/services/business-service';
import { productServiceSchema } from '@/lib/schemas/business';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const products = await businessService.listProducts(session.organization.id);
    return apiSuccess(products, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const json = await req.json();
    const validated = productServiceSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const created = await businessService.addProduct(session.organization.id, validated.data, session.user.id);
    return apiSuccess(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
