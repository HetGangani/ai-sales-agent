import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { leadService } from '@/lib/services/lead-service';
import { createLeadSchema, leadQueryFilterSchema } from '@/lib/schemas/leads';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);

    const queryParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    const parsedFilter = leadQueryFilterSchema.safeParse(queryParams);
    if (!parsedFilter.success) {
      return apiError(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parsedFilter.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const result = await leadService.listLeads(session.organization.id, parsedFilter.data);
    return apiSuccess(result, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'USER' });
    const json = await req.json();
    const validated = createLeadSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const created = await leadService.createLead(session.organization.id, validated.data, session.user.id);
    return apiSuccess(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
