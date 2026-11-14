"use client";
import { useContext, useEffect, useState } from 'react';
import { SupabaseConnection } from '../auth/supabase-context';
import { assertAccountScope, getAccountScope } from '../account-scope';
const checks = new WeakMap<object, Promise<boolean>>();
export function useAdminAccess() {
  const connection = useContext(SupabaseConnection);
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const scope = getAccountScope();
    if (!connection || scope.kind !== 'account') return () => controller.abort();
    let check=checks.get(scope);
    if(!check){ check=(async () => {
      const { data } = await connection.client.auth.getSession();
      assertAccountScope(scope);
      if (data.session?.user.id !== scope.accountId) return false;
      const response = await fetch('/os/admin/status', { headers:{Authorization:`Bearer ${data.session.access_token}`}, cache:'no-store', signal:AbortSignal.any([scope.signal,AbortSignal.timeout(30000)]) });
      assertAccountScope(scope);
      if(!response.ok)checks.delete(scope);
      return response.ok;
    })().catch(()=>{checks.delete(scope);return false;});checks.set(scope,check);}
    void check.then(allowed=>{if(!controller.signal.aborted)setAllowed(allowed);});
    return () => controller.abort();
  }, [connection]);
  return allowed;
}
export function AdminMenuLink({allowed}:{allowed:boolean}) { return allowed ? <button type="button" onClick={() => location.assign('/os/admin')}>Admin</button> : null; }
