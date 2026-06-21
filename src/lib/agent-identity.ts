import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";

import type { ActionType, AgentManifest } from "@/lib/suimesh-data";

export type AgentRegistrationProof = {
  signature?: string;
  signedAtMs?: number;
};

export type ByoAgentChallenge = {
  agentId: string;
  sessionId: string;
  traceId: string;
  semanticType: ActionType;
  sourceTraceId?: string;
  nonce: string;
  createdAtMs: number;
};

export function agentRegistrationMessage(
  manifest: AgentManifest,
  signedAtMs: number
) {
  return [
    "MeshAction BYO Agent Registration",
    `agent_id=${manifest.agent_id}`,
    `endpoint=${manifest.endpoint}`,
    `signing_address=${normalizeAddress(manifest.signing_address)}`,
    `capabilities=${manifest.capabilities.slice().sort().join(",")}`,
    `semantic_types=${manifest.supported_semantic_types.slice().sort().join(",")}`,
    `signed_at_ms=${signedAtMs}`,
  ].join("\n");
}

export function byoAgentChallengeMessage(challenge: ByoAgentChallenge) {
  return [
    "MeshAction BYO Agent Request",
    `agent_id=${challenge.agentId}`,
    `session_id=${challenge.sessionId}`,
    `trace_id=${challenge.traceId}`,
    `semantic_type=${challenge.semanticType}`,
    `source_trace_id=${challenge.sourceTraceId ?? ""}`,
    `nonce=${challenge.nonce}`,
    `created_at_ms=${challenge.createdAtMs}`,
  ].join("\n");
}

export async function verifyAgentRegistration(
  manifest: AgentManifest,
  proof: AgentRegistrationProof
) {
  if (manifest.kind !== "byo") {
    return {
      ...manifest,
      identity_verified: true,
      verified_at_ms: Date.now(),
    } satisfies AgentManifest;
  }

  if (!proof.signature || !proof.signedAtMs) {
    throw new Error("BYO agent registration requires signed_at_ms and registration_signature");
  }
  assertFreshSignature(proof.signedAtMs);
  await verifySignedMessage({
    message: agentRegistrationMessage(manifest, proof.signedAtMs),
    signature: proof.signature,
    expectedAddress: manifest.signing_address,
  });

  return {
    ...manifest,
    signing_address: normalizeAddress(manifest.signing_address),
    identity_verified: true,
    verified_at_ms: Date.now(),
  } satisfies AgentManifest;
}

export async function verifyByoAgentResponse(input: {
  challenge: ByoAgentChallenge;
  signingAddress: string;
  signature?: string;
}) {
  if (!input.signature) {
    throw new Error("BYO agent response is missing signature");
  }
  await verifySignedMessage({
    message: byoAgentChallengeMessage(input.challenge),
    signature: input.signature,
    expectedAddress: input.signingAddress,
  });
}

async function verifySignedMessage(input: {
  message: string;
  signature: string;
  expectedAddress: string;
}) {
  const expectedAddress = normalizeAddress(input.expectedAddress);
  const publicKey = await verifyPersonalMessageSignature(
    new TextEncoder().encode(input.message),
    input.signature
  );
  const signerAddress = normalizeAddress(publicKey.toSuiAddress());
  if (signerAddress !== expectedAddress) {
    throw new Error(
      `signature address ${signerAddress} does not match expected ${expectedAddress}`
    );
  }
}

function normalizeAddress(value: string) {
  if (!isValidSuiAddress(value)) {
    throw new Error(`Invalid Sui address: ${value}`);
  }
  return normalizeSuiAddress(value);
}

function assertFreshSignature(signedAtMs: number) {
  const maxAgeMs = Number(process.env.SUIMESH_AGENT_SIGNATURE_MAX_AGE_MS ?? 10 * 60_000);
  const now = Date.now();
  if (Math.abs(now - signedAtMs) > maxAgeMs) {
    throw new Error("agent registration signature is expired or too far in the future");
  }
}
