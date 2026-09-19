import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { importExportService } from '@/lib/services/import-export-service';
import { importConfirmSchema } from '@/lib/schemas/leads';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const json = await req.json();
    const validated = importConfirmSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const result = await importExportService.confirmImport(
      session.organization.id,
      validated.data.leads,
      validated.data.deduplicationStrategy,
      session.user.id
    );

    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
