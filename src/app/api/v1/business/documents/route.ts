import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { businessService } from '@/lib/services/business-service';
import { documentUploadSchema } from '@/lib/schemas/business';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const docs = await businessService.listDocuments(session.organization.id);
    return apiSuccess(docs, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const json = await req.json();
    const validated = documentUploadSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const doc = await businessService.uploadDocument(session.organization.id, validated.data, session.user.id);
    return apiSuccess(doc, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
