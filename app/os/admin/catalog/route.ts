import { accountAdmin, adminFailure } from '../account-admin-server';

export async function GET(request: Request) {
  try {
    const { url, headers } = await accountAdmin(request);
    const response = await fetch(`${url}/rest/v1/circle_content_drafts?select=*&order=updated_at.desc`, { headers, cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) return Response.json({ error: 'Could not open shared drafts.' }, { status: 503 });
    return Response.json(await response.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return adminFailure(error); }
}

export async function POST(request: Request) {
  try {
    const { url, headers } = await accountAdmin(request);
    const body = await request.json();
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json' || !body.draft?.draftId || JSON.stringify(body).length > 500000) return Response.json({ error: 'Invalid draft.' }, { status: 400 });
    const response = await fetch(`${url}/rest/v1/rpc/circle_save_content_draft`, { method: 'POST', headers, body: JSON.stringify({ draft: body.draft, expected_revision: body.revision, operation_id: body.operationId }), cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) return Response.json({ error: 'This draft could not be saved. Reload to check for another edit. Your device copy is retained.' }, { status: 409 });
    return Response.json(await response.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return adminFailure(error); }
}
