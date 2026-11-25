"use client";
import { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { SupabaseConnection } from '../auth/supabase-context';
import { assertAccountScope, getAccountScope, isAccountScopeCurrent } from '../account-scope';
import { ChapterEditor } from './chapter-editor';
import type { ChapterDraft } from './chapter-authoring.js';
import { ArticleEditor } from './article-editor';
import { ContentRequest } from './content-media';
import { CatalogManager } from './catalog-manager';
import { TemplateEditor } from './template-editor';

function tabOwner(accountId: string) {
  let tab = sessionStorage.getItem('circle-admin-tab');
  if (!tab) { tab = crypto.randomUUID(); sessionStorage.setItem('circle-admin-tab',tab); }
  return `${accountId}:${tab}`;
}

export function AccountAdmin() {
  const connection = useContext(SupabaseConnection);
  const [ownerScope] = useState(getAccountScope);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState('Checking Admin access…');
  const [media, setMedia] = useState(false);
  const [articles, setArticles] = useState(false);
  const [templates, setTemplates] = useState<'routine'|'protocol'|null>(null);
  const [catalog, setCatalog] = useState(false);
  const [assets, setAssets] = useState<Array<{id:string;alt:string;preview:string|null}>>([]);
  const [file, setFile] = useState<File|null>(null);
  const [alt, setAlt] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const revisions = useRef(new Map<string,number>());
  const request = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const scope = ownerScope;
    assertAccountScope(scope);
    if (scope.kind !== 'account' || !connection) throw new Error('Sign in to your Admin account.');
    const { data } = await connection.client.auth.getSession();
    assertAccountScope(scope);
    if (!data.session || data.session.user.id !== scope.accountId) throw new Error('Sign in again.');
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
    const response = await fetch(input, { ...init, headers, cache: 'no-store', signal: AbortSignal.any([scope.signal, AbortSignal.timeout(30000), ...(init?.signal ? [init.signal] : [])]) });
    assertAccountScope(scope);
    if (response.status === 401 || response.status === 403) queueMicrotask(() => { setAllowed(false); setMessage(response.status === 401 ? 'Sign in again.' : 'Admin access is not available for this account.'); });
    return response;
  }, [connection, ownerScope]);
  useEffect(() => {
    let active = true;
    void request('/os/admin/status').then(async response => {
      if (!response.ok) { const detail=await response.json(); throw new Error(detail.error || 'Connection unavailable. Try again.'); }
      if (active) setAllowed(true);
    }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [request]);
  const repository = useMemo(() => ({
    async read() {
      const scope = ownerScope;
      assertAccountScope(scope);
      const response = await request('/os/admin/catalog');
      if (!response.ok) throw new Error('Could not open shared drafts.');
      const rows = await response.json();
      assertAccountScope(scope);
      for (const row of rows) {
        const key = `circle-admin:${tabOwner(scope.accountId)}:${row.id}`;
        const local = JSON.parse(localStorage.getItem(key) || 'null');
        // Keep unacknowledged text; a stale revision will visibly conflict.
        const recovery = JSON.parse(localStorage.getItem(`circle-admin-recovery:${tabOwner(scope.accountId)}:${row.id}`) || 'null');
        if (!local?.pending && !recovery) localStorage.setItem(key, JSON.stringify({ draft: row.draft, revision: row.revision }));
        revisions.current.set(row.id, recovery ? recovery.revision : local?.pending ? local.revision : row.revision);
      }
      const prefix = `circle-admin:${tabOwner(scope.accountId)}:`;
      const recovered = `circle-admin-recovery:${tabOwner(scope.accountId)}:`;
      const drafts = new Map<string,ChapterDraft>();
      for (const key of Object.keys(localStorage).filter(key => key.startsWith(prefix))) { const value = JSON.parse(localStorage.getItem(key)!); drafts.set(value.draft.draftId,value.draft); }
      for (const key of Object.keys(localStorage).filter(key => key.startsWith(recovered))) { const value = JSON.parse(localStorage.getItem(key)!); drafts.set(value.draft.draftId,value.draft); const base = `${prefix}${value.draft.draftId}`; if (!localStorage.getItem(base)) localStorage.setItem(base,JSON.stringify(value)); }
      return [...drafts.values()];
    },
    async write(draft: ChapterDraft) {
      const scope = ownerScope;
      assertAccountScope(scope);
      const key = `circle-admin:${tabOwner(scope.accountId)}:${draft.draftId}`;
      let old = JSON.parse(localStorage.getItem(key) || 'null');
      // Settle an earlier uncertain response before sending newer wording.
      if (old?.pending && JSON.stringify(old.draft) !== JSON.stringify(draft)) {
        const replay = await request('/os/admin/catalog', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(old) });
        if (!replay.ok) throw new Error('Another edit needs review. Your device copy is retained.');
        old = { ...old, revision:(await replay.json()).revision, pending:false };
        assertAccountScope(scope);
        revisions.current.set(draft.draftId,old.revision);
      }
      const pending = old?.pending && JSON.stringify(old.draft) === JSON.stringify(draft) ? old : { draft, revision: revisions.current.get(draft.draftId) ?? old?.revision ?? 0, operationId: crypto.randomUUID(), pending: true };
      localStorage.setItem(key, JSON.stringify(pending));
      const response = await request('/os/admin/catalog', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(pending) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Saved on this device. Try saving online again.');
      assertAccountScope(scope);
      revisions.current.set(draft.draftId,result.revision);
      localStorage.setItem(key, JSON.stringify({ draft, revision: result.revision }));
      const recoveryKey = `circle-admin-recovery:${tabOwner(scope.accountId)}:${draft.draftId}`;
      const recovery = JSON.parse(localStorage.getItem(recoveryKey) || 'null');
      if (JSON.stringify(recovery?.draft) === JSON.stringify(draft)) localStorage.removeItem(recoveryKey);
      else if (recovery) localStorage.setItem(recoveryKey,JSON.stringify({...recovery,revision:result.revision}));
    },
    async remove() { throw new Error('Shared draft removal is not enabled yet.'); },
    recover(draft: ChapterDraft) {
      const scope = ownerScope;
      if (!isAccountScopeCurrent(scope)) return;
      if (scope.kind !== 'account') return;
      const base = JSON.parse(localStorage.getItem(`circle-admin:${tabOwner(scope.accountId)}:${draft.draftId}`) || 'null');
      if (!base?.pending && JSON.stringify(base?.draft) === JSON.stringify(draft)) { localStorage.removeItem(`circle-admin-recovery:${tabOwner(scope.accountId)}:${draft.draftId}`); return; }
      localStorage.setItem(`circle-admin-recovery:${tabOwner(scope.accountId)}:${draft.draftId}`,JSON.stringify({draft,revision:revisions.current.get(draft.draftId) ?? base?.revision ?? 0}));
    },
  }), [request, ownerScope]);
  async function openMedia(successMessage = '') {
    const scope = ownerScope;
    setMedia(true);
    try {
      const response = await request('/os/admin/media');
      const result = await response.json();
      assertAccountScope(scope);
      if (!response.ok) throw new Error(result.error);
      setAssets(result); setMessage(successMessage);
    } catch(error) { setMessage(error instanceof Error ? error.message : 'Could not open images.'); }
  }
  const chapterRepository = useMemo(() => ({ ...repository, read: async () => (await repository.read()).filter(row => !('article' in row) && !('template' in row)) }), [repository]);
  if (!allowed) return <main className="os-admin"><p role="status">{message}</p><button type="button" onClick={()=>void request('/os/admin/status').then(response=>{if(response.ok){setAllowed(true);setMessage('');}else setMessage(response.status===503?'Connection unavailable. Try again.':'Sign in again or check your account access.');}).catch(()=>setMessage('Connection unavailable. Try again.'))}>Retry</button><a href="/os/today">Back to Today</a></main>;
  return <ContentRequest.Provider value={request}>
    <button className="os-admin" onClick={()=>setCatalog(value=>!value)}>Catalog publishing</button>
    {catalog ? <CatalogManager request={request}/> : <>
    <nav className="os-admin os-admin-actions" aria-label="Content tools"><button onClick={() => {setTemplates(null);setMedia(false);setArticles(false);}}>Chapters</button><button onClick={() => {setTemplates(null);setMedia(false);setArticles(true);}}>Articles</button><button onClick={()=>{setMedia(false);setTemplates('routine');}}>Habit templates</button><button onClick={()=>{setMedia(false);setTemplates('protocol');}}>Protocol templates</button><button onClick={() => void openMedia()}>Media</button></nav>
    {media ? <main className="os-admin os-admin-media"><h1>Media</h1><form className="os-admin-panel os-admin-fields os-admin-media-upload" aria-busy={uploading} onSubmit={async event => {
      event.preventDefault(); if (!file || !alt.trim() || uploading) return;
      const scope = ownerScope;
      setUploading(true);
      setMessage('Uploading…');
      const body = new FormData(); body.set('image',file); body.set('alt',alt); body.set('id',uploadId);
      try { const response = await request('/os/admin/media',{method:'POST',body}); const result = await response.json(); assertAccountScope(scope); if (!response.ok) throw new Error(result.error); setFile(null); setAlt(''); setUploadId(''); if (fileInput.current) fileInput.current.value = ''; await openMedia('Image uploaded.'); }
      catch(error) { setMessage(error instanceof Error ? error.message : 'Keep the file and retry.'); }
      finally { setUploading(false); }
    }}>
      <div className="os-admin-field">
        <span id="admin-media-image-label">Image</span>
        <input ref={fileInput} type="file" hidden aria-labelledby="admin-media-image-label" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => { setFile(event.target.files?.[0] || null); setUploadId(crypto.randomUUID()); }} />
        <div className="os-admin-file-picker">
          <button type="button" className="os-admin-choose-file" disabled={uploading} aria-describedby="admin-media-filename admin-media-file-help" onClick={() => fileInput.current?.click()}>Choose file</button>
          <span id="admin-media-filename" aria-live="polite">{file?.name || 'No file chosen'}</span>
        </div>
        <p id="admin-media-file-help">JPEG, PNG or WebP. Up to 5 MB.</p>
      </div>
      <label className="os-admin-field"><span>Alternative text</span><input required maxLength={1000} disabled={uploading} value={alt} onChange={event => setAlt(event.target.value)} /></label>
      <button type="submit" className="os-admin-media-submit" disabled={!file || !alt.trim() || uploading}>{uploading ? 'Uploading…' : 'Upload image'}</button>
    </form><p role="status">{message}</p><section className="os-admin-media-grid" aria-label="Image library">{assets.map(asset => <figure className="os-admin-media-item" key={asset.id}>
      <div className="os-admin-media-thumbnail">
      {/* Signed private previews are short-lived and should bypass image optimization caches. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {asset.preview ? <img src={asset.preview} alt={asset.alt} loading="lazy" /> : <span>Preview unavailable</span>}
      </div>
      <figcaption title={asset.alt}>{asset.alt}</figcaption><button type="button" aria-label={`Copy image reference: ${asset.alt}`} onClick={() => { void navigator.clipboard.writeText(asset.id).then(() => setMessage('Image reference copied.'),() => setMessage('Could not copy the image reference.')); }}>Copy reference</button>
    </figure>)}</section></main> : templates ? <TemplateEditor key={templates} kind={templates} repository={repository}/> : articles ? <ArticleEditor repository={repository}/> : <ChapterEditor repository={chapterRepository} adminRequest={request} accountCatalog />}
    </>}
  </ContentRequest.Provider>;
}
