/** Account Admin uses the caller's token, never the quote service key. */
export class AdminAccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function adminFailure(error: unknown) {
  return Response.json({error: error instanceof AdminAccessError ? error.message : 'Connection unavailable. Try again.'}, {status:error instanceof AdminAccessError ? error.status : 503, headers:{'Cache-Control':'no-store'}});
}
export async function accountAdmin(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = request.headers.get('authorization');
  if (!url || !key) throw new AdminAccessError(503, 'Admin service is unavailable.');
  if (!token?.startsWith('Bearer ')) throw new AdminAccessError(401, 'Sign in again.');
  const headers = { apikey: key, Authorization: token, 'Content-Type': 'application/json' };
  const user = await fetch(`${url}/auth/v1/user`, { headers, cache: 'no-store', signal: AbortSignal.timeout(12000) });
  const identity = user.ok ? await user.json() : null;
  if (user.status >= 500 || user.status === 429) throw new AdminAccessError(503, 'Account service unavailable. Try again.');
  if (!identity?.id || !identity.email_confirmed_at) throw new AdminAccessError(401, 'Sign in again.');
  const role = await fetch(`${url}/rest/v1/rpc/circle_content_admin`, { method: 'POST', headers, body: '{}', cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!role.ok) throw new AdminAccessError(503, 'Admin service unavailable. Try again.');
  if (await role.json() !== true) throw new AdminAccessError(403, 'Admin access is not available for this account.');
  return { url, headers, accountId: identity.id as string };
}
