<p align="center">
  <img src="./public/mesh-action-logo.jpg" alt="MeshAction" width="720" />
</p>

<p align="center">
  <strong>Verifiable execution for AI actions on Sui.</strong>
</p>

<p align="center">
  MeshAction turns an agent proposal into an inspectable, policy-checked, on-chain action with an encrypted audit trail.
</p>

<p align="center">
  <a href="#why-meshaction">Why</a>
  ·
  <a href="#quickstart">Quickstart</a>
  ·
  <a href="#how-it-works">How it works</a>
  ·
  <a href="#verification">Verification</a>
</p>

---

## Why MeshAction

AI agents are useful only when their actions can be trusted. MeshAction is built for workflows where an agent can propose an action, but execution still needs inspection, policy checks, user review, and a durable receipt.

The console is designed around one principle: **agents propose, MeshAction verifies and executes**.

- Inspect the PTB before it touches the chain.
- Run deterministic policy checks before execution.
- Require explicit review for high-risk actions such as copy trading.
- Execute real Sui testnet transactions from the server-side signer.
- Archive receipt context through Walrus and Seal.
- Restore traces later for verification, debugging, or audit.

## What You Can Run

MeshAction currently ships with three Sui action demos:

| Action | What it does | Guardrail |
| --- | --- | --- |
| `transfer` | Sends a small testnet SUI transfer | PTB inspection and policy check |
| `contract_call` | Calls the published `demo_action::mark_action` Move function | Contract target and argument validation |
| `copy_trade` | Mirrors a verified leader PTB into a follower PTB | Explicit execution review before submit |

The same flow can be extended to other actions where the system must separate proposal, review, execution, and audit.

## Product Surface

The app is a workflow console, not a transaction form. A session keeps the full action lifecycle visible:

- Chat for intent, proposal, and execution feedback.
- Workflow graph for each trace step.
- Inspector panel for the selected node.
- BYO agent registry with signed registration.
- Runtime status for Sui, archive, and model configuration.

Sessions are created only when work starts. Verified BYO agents are never selected silently; the user chooses them per action.

## Quickstart

Install dependencies:

```bash
bun install
```

Create an environment file:

```bash
cp .env.example .env.local
```

Point the SDK alias at a local SuiMesh SDK checkout, or update `tsconfig.json` and `next.config.ts` to use your own SDK source path:

```bash
ln -s /path/to/suimesh .suimesh-sdk
```

Set the required runtime values:

```bash
DATABASE_URL=postgresql://admin:admin@127.0.0.1:5432/admin
SUIMESH_SUI_NETWORK=testnet
SUIMESH_SUI_PRIVATE_KEY=suiprivkey...
SUIMESH_SUI_ADDRESS=0x...
```

Start the console:

```bash
bun run dev
```

Run the standard checks:

```bash
bun run lint
bun run build
```

## Configuration

### Sui Signer

Execution uses a server-side Sui signer. Use a Sui bech32 private key when possible:

```bash
SUIMESH_SUI_PRIVATE_KEY=suiprivkey...
SUIMESH_SUI_ADDRESS=0x...
```

A Sui CLI keystore entry is also supported for local compatibility:

```bash
SUIMESH_SUI_KEYSTORE_ENTRY=<base64 Sui CLI keystore entry>
```

Do not commit `.env.local`, `.sui/`, `.sui-home/`, private keys, keystores, generated Move build output, or local SDK aliases. These are ignored by default.

### Hosted Agents

Hosted proposal and audit agents are optional. When enabled, MeshAction can call an OpenAI-compatible chat completions endpoint for proposal generation, while the execution path remains deterministic.

```bash
MESHACTION_LLM_AGENTS=true
MESHACTION_LLM_API_KEY=<provider api key>
MESHACTION_LLM_MODEL=gpt-4.1-mini
MESHACTION_LLM_BASE_URL=https://api.openai.com/v1
```

Compatibility aliases are accepted: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, `SUIMESH_LLM_*`, and `SUIMESH_OPENAI_*`.

If your network requires a proxy, configure the standard `HTTPS_PROXY`, `HTTP_PROXY`, or `ALL_PROXY` environment variables before running the app or tests.

### Walrus And Seal

Walrus and Seal are used for encrypted archive references:

```bash
SUIMESH_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
SUIMESH_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
SUIMESH_WALRUS_EPOCHS=5
SUIMESH_SEAL_PACKAGE_ID=0xdeb6325f80800c0f58d99d28b06a65f4b02adccc3275bd375e144e000bfc6bdd
```

Local archive fallbacks exist for development, but they are not the verification path:

```bash
SUIMESH_WALRUS_DISABLED=true
SUIMESH_SEAL_MODE=local
SUIMESH_LOCAL_ARCHIVE_KEY=<local secret>
```

## How It Works

```text
Intent
  -> Proposal
  -> PTB inspection
  -> Policy evaluation
  -> Claim
  -> User review
  -> Sui execution
  -> Walrus / Seal archive
  -> Trace restore
```

The app stores local session and registry indexes in Postgres. Protocol events, execution receipts, archive references, and restored traces are handled through the SuiMesh SDK.

## BYO Agents

BYO agents register with a Sui personal-message signature. Once verified, an agent can be selected for `transfer`, `contract_call`, or `copy_trade`.

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

## API

| Method | Route |
| --- | --- |
| `GET` | `/agents` |
| `POST` | `/agents/register` |
| `POST` | `/agents/:id/disable` |
| `GET` | `/runtime/status` |
| `GET` | `/sessions` |
| `POST` | `/sessions` |
| `POST` | `/sessions/:id/messages` |
| `GET` | `/sessions/:id/graph` |
| `GET` | `/traces/:id` |
| `POST` | `/traces/:id/propose` |
| `POST` | `/traces/:id/evaluate` |
| `POST` | `/traces/:id/execute` |
| `POST` | `/traces/:id/archive` |

## Verification

The live SuiMesh regression has been run against the public test relayer:

```bash
SUIMESH_NETWORK=testnet \
SUIMESH_RELAYER_URL=https://relay.suimesh.link \
OPENAI_MODEL=gpt-4.1-mini \
SUIMESH_OPENAI_MODEL=gpt-4.1-mini \
SUIMESH_WALRUS_READ_ATTEMPTS=24 \
SUIMESH_WALRUS_READ_DELAY_MS=5000 \
bun run test:live:full-regression
```

Covered path:

- TypeScript check and SDK unit tests.
- Public relayer health check.
- Remote Sui Stack Messaging group creation, message restore, and reconnect restore.
- OpenAI-backed proposal generation and independent proposal verification.
- Live heavy action with testnet execution.
- Walrus archive write, read, and decrypt.
- Full business path: relayer, devInspect, policy, claim, execute, Walrus/Seal archive, reconnect restore, and trace verification.

Recent testnet execution digests:

```text
heavy action execute: 8C9eHVBqoVSu2qQsNBxxnXosSvXGCd4C5B8XuXUb55PY
business e2e execute: 6ZT9QcWZCGri31hBZgCGkSfH6fTtqcrxTZxhnNfdYbY3
```

## Demo Move Package

Published testnet package:

```text
0xdeb6325f80800c0f58d99d28b06a65f4b02adccc3275bd375e144e000bfc6bdd
```

Build locally:

```bash
sui move build --path contracts/demo_move_call
```

## Repository

```text
src/app                 Next.js routes and API handlers
src/components/console  Console UI and workflow graph
src/components/ui       Local UI primitives
src/lib                 SuiMesh, Sui, auth, storage, and agent runtime code
scripts                 Smoke test entrypoints
contracts               Demo Move package
docs/concepts           Product and design references
```
