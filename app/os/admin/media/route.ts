import { accountAdmin, adminFailure } from '../account-admin-server';

export async function GET(request: Request) {
  try {
    const { url, headers } = await accountAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (id && !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({error:'Invalid image'},{status:400});
    const result = await fetch(`${url}/rest/v1/circle_content_assets?select=*&order=created_at.desc${id ? `&id=eq.${id}` : ''}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!result.ok) throw new Error();
    const assets = await result.json();
    for (const asset of assets) {
      const signed = await fetch(`${url}/storage/v1/object/sign/circle-content/${asset.id}`, { method: 'POST', headers, body: JSON.stringify({ expiresIn: 300 }), cache: 'no-store', signal: AbortSignal.timeout(12000) });
      const value = signed.ok ? await signed.json() : null;
      asset.preview = value?.signedURL ? `${url}/storage/v1${value.signedURL}` : null;
    }
    return Response.json(assets, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return adminFailure(error); }
}

export async function POST(request: Request) {
  try {
    const { url, headers } = await accountAdmin(request);
    if (Number(request.headers.get('content-length') || 0) > 5300000) return Response.json({ error: 'Choose an image under 5 MB.' }, { status: 400 });
    const form = await request.formData();
    const file = form.get('image');
    const alt = String(form.get('alt') || '').trim();
    const id = String(form.get('id') || '');
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024 || !alt || alt.length > 1000 || !/^[0-9a-f-]{36}$/.test(id)) return Response.json({error:'Choose a valid image and description.'},{status:400});
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg' : bytes.slice(0,8).join() === '137,80,78,71,13,10,26,10' ? 'image/png' : new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP' ? 'image/webp' : '';
    if (!mime || file.type !== mime) return Response.json({ error: 'Choose a JPEG, PNG or WebP image.' }, { status: 400 });
    const upload = await fetch(`${url}/storage/v1/object/circle-content/${id}`, { method: 'POST', headers: { ...headers, 'Content-Type': mime, 'x-upsert': 'false' }, body: bytes, signal: AbortSignal.timeout(20000) });
    // A retried, immutable object may already exist. The metadata insert below
    // is idempotent; storage never accepts replacement bytes.
    if (!upload.ok) {
      const existing = await fetch(`${url}/storage/v1/object/authenticated/circle-content/${id}`, { headers, cache:'no-store', signal:AbortSignal.timeout(12000) });
      if (!existing.ok) throw new Error();
      const stored = new Uint8Array(await existing.arrayBuffer());
      if (stored.length !== bytes.length || !stored.every((value,index) => value === bytes[index])) throw new Error();
    }
    const saved = await fetch(`${url}/rest/v1/circle_content_assets?on_conflict=id`, { method: 'POST', headers: { ...headers, Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ id, alt, mime, bytes: file.size }), signal: AbortSignal.timeout(12000) });
    if (!saved.ok) throw new Error();
    return Response.json({ saved: true });
  } catch (error) { return adminFailure(error); }
}
