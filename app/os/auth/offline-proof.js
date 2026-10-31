import { createLocalJWKSet, decodeJwt, jwtVerify } from "jose";

// This proof unlocks this browser's local copy only. It never authorizes a
// server request. Cached public keys and local records are not device encryption.
export async function verifyOfflineProof(proof, issuer, now = Date.now()) {
  if (!proof || proof.issuer !== issuer || !proof.confirmed || !proof.token || !proof.jwks) return null;
  try {
    const claims = decodeJwt(proof.token);
    if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) ||
      claims.exp <= claims.iat || claims.iat * 1000 > now + 60_000) return null;
    // Expiry limits server access. The approved offline behavior deliberately
    // accepts the previously verified signed token after expiry, until logout.
    const { payload } = await jwtVerify(proof.token, createLocalJWKSet(proof.jwks), {
      issuer, audience: "authenticated", algorithms: ["ES256", "RS256"],
      currentDate: new Date(Math.min(now, (claims.exp - 1) * 1000)),
    });
    if (payload.sub !== proof.accountId || payload.role !== "authenticated" || !payload.session_id) return null;
    return { id: payload.sub, alias: typeof proof.alias === "string" ? proof.alias : "" };
  } catch { return null; }
}
