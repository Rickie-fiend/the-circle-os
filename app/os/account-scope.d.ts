type ScopeMarker = {
  kind: "legacy" | "account" | "signed-out";
  accountId: string;
  epoch: string;
};

export type AccountScope = Readonly<ScopeMarker & { signal: AbortSignal }>;
export const ACCOUNT_SCOPE_STORAGE_KEY: string;
export class AccountScopeChangedError extends Error {}
export function getAccountScope(): AccountScope;
export function getServerAccountScope(): AccountScope;
export function subscribeAccountScope(listener: () => void): () => void;
export function activateAccountScope(accountId: string | null): AccountScope;
export function isAccountScopeCurrent(scope: AccountScope): boolean;
export function assertAccountScope(scope: AccountScope): void;
export function accountStorageKey(scope: AccountScope, legacyKey: string): string;
export function scopedTransaction<T>(
  scope: AccountScope,
  databaseName: string,
  storeName: string,
  mode: IDBTransactionMode,
  create: (database: IDBDatabase) => void,
  work: (store: IDBObjectStore, result: (value: T) => void, fail: (error: Error) => void) => void,
): Promise<T>;
