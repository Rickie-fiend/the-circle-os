import { accountAdmin, adminFailure } from '../account-admin-server';
export async function GET(request: Request) {
  try { await accountAdmin(request); return Response.json({ admin: true }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return adminFailure(error); }
}
