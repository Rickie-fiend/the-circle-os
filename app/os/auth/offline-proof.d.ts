import type { JSONWebKeySet } from "jose";
export type OfflineProof = {
  issuer: string; token: string; jwks: JSONWebKeySet; confirmed: boolean;
  accountId: string; alias: string;
};
export function verifyOfflineProof(proof: OfflineProof | null, issuer: string, now?: number): Promise<{ id: string; alias: string } | null>;
