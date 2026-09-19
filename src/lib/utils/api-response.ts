import { NextResponse } from 'next/server';
import { ApiResponse, ApiErrorResponse, ApiErrorDetail } from '@/lib/types/domain';

/**
 * Creates a standardized successful API response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

/**
 * Creates a standardized error API response
 */
export function apiError(
  message: string,
  code: string = 'BAD_REQUEST',
  status: number = 400,
  details?: ApiErrorDetail[]
) {
  const body: ApiErrorResponse = {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

export class AppError extends Error {
  public code: string;
  public status: number;
  public details?: ApiErrorDetail[];

  constructor(message: string, code: string = 'INTERNAL_ERROR', status: number = 500, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(err: unknown) {
  console.error('[API Error Handler]:', err);
  if (err instanceof AppError) {
    return apiError(err.message, err.code, err.status, err.details);
  }
  if (err instanceof Error) {
    return apiError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
  return apiError('An unexpected server error occurred', 'INTERNAL_SERVER_ERROR', 500);
}
