import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { importExportService } from '@/lib/services/import-export-service';
import { handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'USER' });
    const { searchParams } = new URL(req.url);

    const format = (searchParams.get('format') || 'csv').toLowerCase();
    if (format !== 'csv' && format !== 'xlsx') {
      return apiError('Format must be either csv or xlsx', 'BAD_REQUEST', 400);
    }

    const { buffer, fileName, contentType } = await importExportService.exportLeads(
      session.organization.id,
      format,
      {},
      session.user.id
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
