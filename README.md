# MeshAction

MeshAction is a workflow console for verifiable Sui actions. It gives a user one place to prepare an action, inspect the PTB, run policy checks, execute on testnet, archive the receipt context, and restore the trace later.

The current app focuses on three demo actions:

- `transfer`: send a small testnet SUI transfer.
- `contract_call`: call the published `demo_action::mark_action` Move function.
- `copy_trade`: mirror a verified leader PTB into a follower PTB with an explicit execution review step.

## What It Does

The console is built around the trace, not around a simple transaction form. A session contains the user intent, proposal, inspected action, policy decision, claim, execution receipt, archive reference, and audit event. The UI keeps those steps visible through chat, a workflow graph, and a selected-node inspector.

Important product behavior:

- Sessions are created only when the user starts work, not when the page loads.
- `copy_trade` cannot execute until a PTB has been inspected and the user has explicitly confirmed the risk review.
- BYO agents are opt-in per action. A verified BYO agent in the registry is never selected silently.
- Execution records are written as protocol events and can be restored for verification.

## Stack

- Next.js App Router
- React 19
- Bun
- Tailwind CSS v4
- shadcn/Base UI primitives
- React Flow
- Postgres for local session, trace, and registry indexes
- SuiMesh SDK, imported through the `@suimesh/sdk` alias
- Sui testnet, Walrus, and Seal for the live demo path

## Repository Layout

```text
src/app                 Next.js routes and API handlers
src/components/console  Console UI and workflow graph
src/components/ui       Local UI primitives
src/lib                 SuiMesh, Sui, auth, storage, and agent runtime code
scripts                 Smoke test entrypoints
contracts               Demo Move package
docs/concepts           Product/design reference
```

The app imports the SuiMesh SDK through the `@suimesh/sdk` TypeScript alias. For local development, point `.suimesh-sdk` at an SDK checkout or update `tsconfig.json` and `next.config.ts` to match your own SDK source location. `.suimesh-sdk` is intentionally ignored because it is a machine-local alias.

## Local Setup

Install dependencies:

```bash
bun install
```

Create a local environment from the template:

```bash
cp .env.example .env.local
```

At minimum, set:

```bash
DATABASE_URL=postgresql://admin:admin@127.0.0.1:5432/admin
SUIMESH_SUI_NETWORK=testnet
SUIMESH_SUI_PRIVATE_KEY=suiprivkey...
SUIMESH_SUI_ADDRESS=0x...
```

You can also use a Sui CLI keystore entry instead of `SUIMESH_SUI_PRIVATE_KEY`:

```bash
SUIMESH_SUI_KEYSTORE_ENTRY=<base64 Sui CLI keystore entry>
```

Never commit `.env.local`, `.sui/`, `.sui-home/`, private keys, keystores, or generated build output. The repository ignores those paths.

Start the app:

```bash
bun run dev
```

Run the standard checks:

```bash
bun run lint
bun run build
```

## Hosted Agent Configuration

Hosted proposal and audit agents are optional. When enabled, the app calls an OpenAI-compatible chat completions endpoint, then still builds, inspects, evaluates, claims, executes, and archives deterministically.

```bash
MESHACTION_LLM_AGENTS=true
MESHACTION_LLM_API_KEY=<provider api key>
MESHACTION_LLM_MODEL=gpt-4.1-mini
MESHACTION_LLM_BASE_URL=https://api.openai.com/v1
```

Compatibility aliases are also accepted: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, `SUIMESH_LLM_*`, and `SUIMESH_OPENAI_*`.

If your local network cannot reach OpenAI directly, set a proxy before running the app or tests:

```bash
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7890
```

## Sui, Walrus, And Seal

Simulation uses Sui RPC `devInspectTransactionBlock` against the configured network. Execution signs and submits real testnet transactions with the server-side signer.

Walrus and Seal are used for encrypted archive references:

```bash
SUIMESH_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
SUIMESH_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
SUIMESH_WALRUS_EPOCHS=5
SUIMESH_SEAL_PACKAGE_ID=0xdeb6325f80800c0f58d99d28b06a65f4b02adccc3275bd375e144e000bfc6bdd
```

Development fallbacks exist, but they are not the production path:

```bash
SUIMESH_WALRUS_DISABLED=true
SUIMESH_SEAL_MODE=local
SUIMESH_LOCAL_ARCHIVE_KEY=<local secret>
```

## BYO Agents

BYO agents register with a Sui personal-message signature. Once verified, a BYO agent can be selected for `transfer`, `contract_call`, or `copy_trade`.

Registration signs this body:

```text
MeshAction BYO Agent Registration
agent_id=<agent_id>
endpoint=<endpoint>
signing_address=<sui_address>
capabilities=<sorted comma list>
semantic_types=<sorted comma list>
signed_at_ms=<unix ms>
```

Production BYO endpoints must use HTTPS and must not resolve to loopback or private network addresses. Local HTTP endpoints are available only when explicitly enabled:

```bash
SUIMESH_ALLOW_INSECURE_BYO_HTTP=true
SUIMESH_ALLOW_LOCAL_BYO_ENDPOINTS=true
```

## API Surface

- `GET /agents`
- `POST /agents/register`
- `POST /agents/:id/disable`
- `GET /runtime/status`
- `GET /sessions`
- `POST /sessions`
- `POST /sessions/:id/messages`
- `GET /sessions/:id/graph`
- `GET /traces/:id`
- `POST /traces/:id/propose`
- `POST /traces/:id/evaluate`
- `POST /traces/:id/execute`
- `POST /traces/:id/archive`

## Live Verification

The SuiMesh SDK live regression was run against the public test relayer:

```bash
SUIMESH_NETWORK=testnet \
SUIMESH_RELAYER_URL=https://relay.suimesh.link \
OPENAI_MODEL=gpt-4.1-mini \
SUIMESH_OPENAI_MODEL=gpt-4.1-mini \
SUIMESH_WALRUS_READ_ATTEMPTS=24 \
SUIMESH_WALRUS_READ_DELAY_MS=5000 \
bun run test:live:full-regression
```

Result: passed.

Covered steps:

- TypeScript check and SDK unit tests.
- Public relayer health check.
- Remote Sui Stack Messaging group creation, message restore, and reconnect restore.
- OpenAI-backed proposal generation and independent proposal verification.
- Live heavy action with testnet execution.
- Walrus archive write/read/decrypt.
- Full business path: relayer, devInspect, policy, claim, execute, Walrus/Seal archive, reconnect restore, and trace verification.

Recent live transaction digests:

```text
heavy action execute: 8C9eHVBqoVSu2qQsNBxxnXosSvXGCd4C5B8XuXUb55PY
business e2e execute: 6ZT9QcWZCGri31hBZgCGkSfH6fTtqcrxTZxhnNfdYbY3
```

## Demo Package

Published testnet package:

```text
0xdeb6325f80800c0f58d99d28b06a65f4b02adccc3275bd375e144e000bfc6bdd
```

Move build:

```bash
sui move build --path contracts/demo_move_call
```
