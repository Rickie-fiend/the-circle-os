export type AuthState = {
  phase: "checking" | "signed-out" | "password" | "alias" | "ready";
  accountId: string; alias: string; message: string; offline: boolean;
};
type Identity = { id: string; alias: string; offline?: boolean; passwordRequired?: boolean } | null;
export type AuthAdapter = {
  openScope(id: string): void; closeScope(): void; forget(): void; cancelPending(): void;
  restore(): Promise<Identity>; signIn(email: string, password: string): Promise<Identity>;
  consumeLink(link: { token_hash: string; type: "invite" | "recovery" }): Promise<void>;
  setPassword(password: string): Promise<Identity>; setAlias(alias: string): Promise<Identity>;
  signOut(): Promise<void>; message(error: unknown): string;
};
export function createAuthController(adapter: AuthAdapter): {
  getSnapshot(): AuthState; subscribe(listener: () => void): () => void;
  restore(): Promise<void>; signIn(email: string, password: string): Promise<void>;
  consumeLink(link: { token_hash: string; type: "invite" | "recovery" }): Promise<void>;
  setPassword(password: string): Promise<void>; setAlias(alias: string): Promise<void>;
  signOut(): Promise<void>; revoked(): void; dispose(): void; cancelPending(): void;
};
