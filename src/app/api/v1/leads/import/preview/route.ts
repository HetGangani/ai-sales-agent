import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { importExportService } from '@/lib/services/import-export-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });

    let fileBuffer: Buffer | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return apiError('Missing file in form data upload', 'BAD_REQUEST', 400);
      }
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const json = await req.json();
      if (json.fileBase64) {
        fileBuffer = Buffer.from(json.fileBase64, 'base64');
      } else if (json.rawCsv) {
        fileBuffer = Buffer.from(json.rawCsv, 'utf-8');
      }
    }

    if (!fileBuffer) {
      return apiError('No file provided. Send multipart/form-data or fileBase64 / rawCsv in JSON.', 'BAD_REQUEST', 400);
    }

    const preview = await importExportService.previewImport(session.organization.id, fileBuffer);
    return apiSuccess(preview, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
