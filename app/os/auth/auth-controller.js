// Framework-independent lifecycle: every asynchronous result belongs to an
// attempt. Logout, a link, or a newer attempt makes older results harmless.
export function createAuthController(adapter) {
  let state = { phase: "checking", accountId: "", alias: "", message: "", offline: false };
  let generation = 0;
  let disposed = false;
  const listeners = new Set();
  const emit = (patch) => {
    if (disposed) return;
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  const close = () => adapter.closeScope();
  function locked(message = "") {
    try { close(); } catch { message = "This window is locked. Your browser could not save sign-out. Keep this browser private until you can sign out again."; }
    emit({ phase: "signed-out", accountId: "", alias: "", offline: false, message });
  }
  async function accept(result, attempt) {
    if (disposed || attempt !== generation) return;
    if (!result) { locked(); return; }
    if (result.passwordRequired) {
      close(); emit({ phase: "password", accountId: "", alias: "", offline: false, message: "" }); return;
    }
    adapter.openScope(result.id);
    emit({ phase: result.alias ? "ready" : "alias", accountId: result.id,
      alias: result.alias, offline: Boolean(result.offline), message: "" });
  }
  async function restore() {
    const attempt = ++generation;
    // Keep a known account usable during a temporary network retry. Startup
    // remains locked, and a definite rejection always closes the scope.
    if (state.phase !== "ready") emit({ phase: "checking", message: "" });
    try { await accept(await adapter.restore(), attempt); }
    catch (error) {
      if (!disposed && attempt === generation) locked(adapter.message(error));
    }
  }
  async function signIn(email, password) {
    const attempt = ++generation;
    locked(); emit({ phase: "checking" });
    try { await accept(await adapter.signIn(email, password), attempt); }
    catch (error) {
      if (!disposed && attempt === generation) locked(adapter.message(error));
    }
  }
  async function consumeLink(link) {
    const attempt = ++generation;
    locked(); emit({ phase: "checking" });
    try {
      await adapter.consumeLink(link);
      if (!disposed && attempt === generation) emit({ phase: "password", message: "" });
    } catch {
      if (!disposed && attempt === generation) locked("This link has expired or was already used. Ask for a new one.");
    }
  }
  async function setPassword(password) {
    const attempt = ++generation;
    try { await accept(await adapter.setPassword(password), attempt); }
    catch (error) {
      if (!disposed && attempt === generation) emit({ message: adapter.message(error) });
    }
  }
  async function setAlias(alias) {
    const attempt = ++generation;
    try { await accept(await adapter.setAlias(alias), attempt); }
    catch (error) {
      if (!disposed && attempt === generation) emit({ message: adapter.message(error) });
    }
  }
  async function signOut() {
    ++generation;
    locked();
    // Remove offline proof synchronously, before waiting for the network.
    try { adapter.forget(); await adapter.signOut(); }
    catch { emit({ message: "This window is locked. Sign-out could not finish. Check your connection and browser storage before sharing this browser." }); }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    restore, signIn, consumeLink, setPassword, setAlias, signOut,
    cancelPending() { ++generation; adapter.cancelPending(); },
    revoked() { ++generation; locked(); try { adapter.forget(); } catch { emit({ message: "Your browser could not clear sign-in. Close this window and check browser storage before using a shared device." }); } },
    dispose() { disposed = true; ++generation; listeners.clear(); },
  };
}
