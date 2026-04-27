# CLAUDE.md

## What this is

A Pi extension that registers FriendliAI's serverless models under two providers — `friendliai-chat-completions` (OpenAI-compatible) and `friendliai-messages` (Anthropic-compatible). Same models, two API protocols.

Long-term goal: enough adoption to motivate FriendliAI being added as a first-class provider in pi-mono itself.

## File layout

- `index.ts` — extension entry. Registers a `session_start` handler that does the conflict check + provider registration once per Pi launch.
- `models.ts` — loads `models.json`, casts to typed `Model[]`, re-exports.
- `models.json` — model data (pricing, context window, max tokens). Contributor-editable.

Files live at the package root, not under `src/`, because Pi uses the entry file's parent directory as the extension's display name in the `[Extensions]` block. A `src/` layout shows as "src" in Pi's UI.

## Design decisions worth knowing

**Registration runs inside `session_start`, not at top-level.**
Top-level registration would clobber any FriendliAI providers in the user's `~/.pi/agent/models.json` — `applyProviderConfig` in pi-mono's `model-registry.ts` does full replacement (not merge) when `models` is passed. Running inside `session_start` lets the conflict check inspect the registry after `models.json` is loaded.

Known consequence: Pi's "No models available" warning fires at startup before `session_start`. Misleading but accepted. The cleaner fix (read `~/.pi/agent/models.json` directly at top-level) was rejected as "reaching into Pi's config space."

**The `providersRegistered` guard prevents false-positive notifications.**
`session_start` fires every session. Without the guard, the second session's conflict check would see *our own* registrations from the first session and falsely tell the user they configured something they didn't.

**No override file. Defer to `~/.pi/agent/models.json` instead.**
Originally planned to introduce a separate `~/.pi/friendliai-models.json`. Dropped — meeting users where they already manage providers beats inventing a new file. Conflict policy: detect via `context.modelRegistry.getAll()`, notify, skip the affected provider. **No merging.**

**No JSON validation / TypeBox.**
Originally planned for when the override file existed (untrusted user input). The override file went away, so the only JSON parsed is `models.json` (in repo, hand-edited). Pi validates the registered config at registration time. Don't add validation without a new reason.

**Auth uses Pi's built-in `/login` flow.**
`/login` shows a universal provider picker with an "API Key" option for any registered provider — works without an `oauth` block. The extension does **not** declare `oauth`: that would misrepresent a personal access token paste as OAuth. The `apiKey: "FRIENDLIAI_API_TOKEN"` env var name in `registerProvider` is a fallback for headless/CI scenarios.

## Data verification status (as of 2026-04-26)

- **`cost`** — verified against `https://friendli.ai/models/zai-org/GLM-5.1` and `/GLM-5`.
- **`contextWindow: 200000`** — *not* corroborated by FriendliAI. HuggingFace `config.json` for both models reports `max_position_embeddings: 202752`. The current value is conservative; whether FriendliAI serves the full architectural context is unverified.
- **`maxTokens: 32000`** — not from any FriendliAI page; not in HF config (it's a runtime/API setting, not architectural). Origin unverified. Empirical probing of the API would confirm.

FriendliAI does not currently expose a `/v1/models` endpoint or a machine-readable model catalog on serverless. The `/docs/guides/supported-models` page is JS-rendered and not parseable via plain HTTP.

## Restart vs new session

Changes to `models.json`, `index.ts`, or the user's `~/.pi/agent/models.json` require a **process restart** (exit Pi, re-launch). A new session within the same Pi process keeps the extension's closure state and the existing in-memory registry.

## Useful pi-mono source references

- `packages/coding-agent/src/core/model-registry.ts` — `registerProvider`, `applyProviderConfig`, `mergeCustomModels`, `loadModels`. Source of truth for registration semantics (full replace, not merge) and `models.json` parsing.
- `packages/coding-agent/src/core/extensions/types.ts` — `ExtensionAPI`, `ExtensionContext`, `ProviderConfig`, `ProviderModelConfig`. The `pi` (declarative) vs `ctx` (runtime) split lives here.
- `packages/coding-agent/src/core/auth-storage.ts` — `ApiKeyCredential`, `OAuthCredential`, persistence at `~/.pi/agent/auth.json`.
- `packages/coding-agent/examples/extensions/custom-provider-anthropic` and `custom-provider-qwen-cli` — closest working references for an extension that registers a provider.

## Local commands

- `npm run ts:check` — `tsc --noEmit`
- `npm run biome:check` / `:write` / `:write:unsafe` — lint and format
- `pi -e $(pwd)` — load this extension in a local Pi run

## Deferred

- README — intentionally empty; owner fills it before pushing/publishing.
- npm publish.
- Verifying `contextWindow` and `maxTokens` against FriendliAI's actual served limits.
- Feature requests upstream:
  - FriendliAI: machine-readable model metadata (`/v1/models` or JSON catalog).
  - pi-mono: extension-exposed `ApiKeyCredential` registration API; using `package.json#name` for the `[Extensions]` display label.
