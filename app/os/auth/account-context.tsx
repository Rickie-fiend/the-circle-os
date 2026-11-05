"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { getAccountScope, getServerAccountScope, subscribeAccountScope } from "../account-scope";

export type AccountIdentity = {
  accountId: string;
  alias: string;
  busy: boolean;
  message: string;
  saveAlias(value: string): Promise<boolean>;
  signOut(): Promise<void>;
};

export const AccountContext = createContext<AccountIdentity | null>(null);

/** Display identity belongs to the verified, currently selected account. */
export function useAccountIdentity() {
  const account = useContext(AccountContext);
  const scope = useSyncExternalStore(subscribeAccountScope, getAccountScope, getServerAccountScope);
  return scope.kind === "account" && account?.accountId === scope.accountId ? account : null;
}
