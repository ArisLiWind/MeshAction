import { createHash, randomBytes, randomUUID } from "node:crypto";

import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";
import { cookies } from "next/headers";

import { query } from "@/lib/db";

const AUTH_COOKIE_NAME = "meshaction_session";
const CHALLENGE_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60_000;

type ChallengeRow = {
  challenge_id: string;
  wallet_address: string;
  message: string;
  expires_at: Date;
  consumed_at: Date | null;
};

type AuthSessionRow = {
  user_id: string;
  wallet_address: string;
  created_at: Date;
  last_seen_at: Date;
};

export type AuthUser = {
  user_id: string;
  wallet_address: string;
  created_at: string;
  last_seen_at: string;
};

export class AuthRequiredError extends Error {
  constructor(message = "Wallet sign-in required") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function normalizeWalletAddress(value: string) {
  if (!isValidSuiAddress(value)) {
    throw new Error(`Invalid Sui address: ${value}`);
  }
  return normalizeSuiAddress(value);
}

export function walletAuthMessage(input: {
  walletAddress: string;
  challengeId: string;
  nonce: string;
  issuedAtMs: number;
  expiresAtMs: number;
}) {
  return [
    "MeshAction Wallet Sign-In",
    `wallet_address=${normalizeWalletAddress(input.walletAddress)}`,
    `challenge_id=${input.challengeId}`,
    `nonce=${input.nonce}`,
    `issued_at_ms=${input.issuedAtMs}`,
    `expires_at_ms=${input.expiresAtMs}`,
  ].join("\n");
}

export async function createWalletChallenge(walletAddressInput: string) {
  const walletAddress = normalizeWalletAddress(walletAddressInput);
  const challengeId = `auth_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const nonce = randomBytes(18).toString("base64url");
  const issuedAtMs = Date.now();
  const expiresAtMs = issuedAtMs + CHALLENGE_TTL_MS;
  const message = walletAuthMessage({
    walletAddress,
    challengeId,
    nonce,
    issuedAtMs,
    expiresAtMs,
  });

  await query(
    `
      insert into suimesh_auth_challenges (
        challenge_id,
        wallet_address,
        message,
        nonce,
        expires_at
      )
      values ($1, $2, $3, $4, to_timestamp($5 / 1000.0))
    `,
    [challengeId, walletAddress, message, nonce, expiresAtMs]
  );

  return {
    challenge_id: challengeId,
    wallet_address: walletAddress,
    message,
    expires_at_ms: expiresAtMs,
  };
}

export async function createSessionFromChallenge(input: {
  challengeId: string;
  signature: string;
}) {
  const challenge = await consumeChallenge(input.challengeId);
  await verifySignedWalletMessage({
    message: challenge.message,
    signature: input.signature,
    expectedAddress: challenge.wallet_address,
  });

  const userId = `user_${createHash("sha256")
    .update(challenge.wallet_address)
    .digest("hex")
    .slice(0, 24)}`;
  const userResult = await query<AuthSessionRow>(
    `
      insert into suimesh_users (user_id, wallet_address)
      values ($1, $2)
      on conflict (wallet_address) do update
      set last_seen_at = now()
      returning user_id, wallet_address, created_at, last_seen_at
    `,
    [userId, challenge.wallet_address]
  );
  const user = userResult.rows[0];
  if (!user) {
    throw new Error("Unable to create wallet user");
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await query(
    `
      insert into suimesh_user_sessions (
        session_token_hash,
        user_id,
        wallet_address,
        expires_at
      )
      values ($1, $2, $3, $4)
    `,
    [tokenHash, user.user_id, user.wallet_address, expiresAt]
  );

  return {
    user: authUserFromRow(user),
    cookie: {
      name: AUTH_COOKIE_NAME,
      value: token,
      expires: expiresAt,
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    },
  };
}

export async function setAuthCookie(cookie: {
  name: string;
  value: string;
  expires: Date;
  maxAge: number;
}) {
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: cookie.expires,
    maxAge: cookie.maxAge,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    await query(
      `
        update suimesh_user_sessions
        set revoked_at = now()
        where session_token_hash = $1
      `,
      [hashSessionToken(token)]
    );
  }
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function currentAuthUser(): Promise<AuthUser | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return undefined;
  }
  const result = await query<AuthSessionRow>(
    `
      update suimesh_user_sessions as sessions
      set last_seen_at = now()
      from suimesh_users as users
      where sessions.session_token_hash = $1
        and sessions.user_id = users.user_id
        and sessions.revoked_at is null
        and sessions.expires_at > now()
      returning users.user_id, users.wallet_address, users.created_at, sessions.last_seen_at
    `,
    [hashSessionToken(token)]
  );
  const user = result.rows[0];
  return user ? authUserFromRow(user) : undefined;
}

export async function requireAuth() {
  const user = await currentAuthUser();
  if (!user) {
    throw new AuthRequiredError();
  }
  return user;
}

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }
  const requestUrl = new URL(request.url);
  const acceptedOrigins = new Set([requestUrl.origin]);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  if (host) {
    acceptedOrigins.add(`${protocol}://${host}`);
  }

  if (
    !acceptedOrigins.has(origin) &&
    !isLoopbackOriginEquivalent(origin, [...acceptedOrigins])
  ) {
    throw new ForbiddenError("Cross-origin state-changing request rejected");
  }
}

async function consumeChallenge(challengeId: string) {
  const result = await query<ChallengeRow>(
    `
      update suimesh_auth_challenges
      set consumed_at = now()
      where challenge_id = $1
        and consumed_at is null
        and expires_at > now()
      returning challenge_id, wallet_address, message, expires_at, consumed_at
    `,
    [challengeId]
  );
  const challenge = result.rows[0];
  if (!challenge) {
    throw new Error("Auth challenge not found, expired, or already consumed");
  }
  return challenge;
}

async function verifySignedWalletMessage(input: {
  message: string;
  signature: string;
  expectedAddress: string;
}) {
  const expectedAddress = normalizeWalletAddress(input.expectedAddress);
  const publicKey = await verifyPersonalMessageSignature(
    new TextEncoder().encode(input.message),
    input.signature
  );
  const signerAddress = normalizeWalletAddress(publicKey.toSuiAddress());
  if (signerAddress !== expectedAddress) {
    throw new Error(
      `signature address ${signerAddress} does not match expected ${expectedAddress}`
    );
  }
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isLoopbackOriginEquivalent(origin: string, acceptedOrigins: string[]) {
  const parsedOrigin = safeUrl(origin);
  if (!parsedOrigin || !isLoopbackHost(parsedOrigin.hostname)) {
    return false;
  }
  return acceptedOrigins.some((acceptedOrigin) => {
    const parsedAccepted = safeUrl(acceptedOrigin);
    return (
      parsedAccepted &&
      isLoopbackHost(parsedAccepted.hostname) &&
      parsedAccepted.protocol === parsedOrigin.protocol &&
      parsedAccepted.port === parsedOrigin.port
    );
  });
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function safeUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function authUserFromRow(row: AuthSessionRow): AuthUser {
  return {
    user_id: row.user_id,
    wallet_address: row.wallet_address,
    created_at: row.created_at.toISOString(),
    last_seen_at: row.last_seen_at.toISOString(),
  };
}
