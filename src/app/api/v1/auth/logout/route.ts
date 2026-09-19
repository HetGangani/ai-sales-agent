import { apiSuccess } from '@/lib/utils/api-response';

export async function POST() {
  const response = apiSuccess({ message: 'Logged out successfully' }, 200);
  response.cookies.delete('auth_token');
  return response;
}
