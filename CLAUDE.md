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
`/login` shows a universal provider picker with an "API Key" option for any registered provider — works without an `oauth` block. The extension does **not** declare `oauth`: that would misrepresent a personal access token paste as OAuth. The `apiKey: "$FRIENDLIAI_API_TOKEN"` env var reference in `registerProvider` is a fallback for headless/CI scenarios.

## Data verification status (as of 2026-06-13)

FriendliAI exposes a machine-readable serverless catalog at `https://api.friendli.ai/serverless/v1/models`. It's the OpenAI `/v1/models` shape (a `data[]` array) with FriendliAI extensions: `pricing.{input,output,input_cache_read}`, `context_length`, `max_completion_tokens`, `functionality`, and `deprecation_date`. Unauthenticated GET. This is now the source of truth for `models.json`.

- **`cost`, `contextWindow`, `maxTokens`** — taken directly from the endpoint: `pricing.input`/`output` → `cost.input`/`output`, `pricing.input_cache_read` → `cost.cacheRead` (absent ⇒ `0`), `context_length` → `contextWindow`, `max_completion_tokens` → `maxTokens`. The earlier conservative GLM values (`200000` / `32000`) were corrected to the served `202752` / `202752`.
- **`cacheWrite: 0`** — the endpoint carries no cache-write field; FriendliAI does not price cache writes.
- **`reasoning` and `input`** — *not* in the endpoint; both are inferred per model and hand-maintained. `input: ["text"]` for all current entries — the endpoint already omits non-text serverless models (e.g. `openai/whisper-large-v3` transcription, `google/gemma-4-31B-it` multimodal), so the catalog it returns is the text-chat set. `reasoning` is a judgment call: the `Instruct` models are `false`; `LGAI-EXAONE/K-EXAONE-236B-A23B`, `MiniMaxAI/MiniMax-M2.5`, and `deepseek-ai/DeepSeek-V3.2` are set to `true` but unverified.

The `/docs/guides/supported-models` page and the `friendli.ai/models` grid are JS-rendered and not parseable via plain HTTP — use the JSON endpoint above instead.

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

## Display name format (intentional)

Model display names are `${model.id} (${provider.apiLabel})` — e.g. `zai-org/GLM-5.1 (FriendliAI's Chat Completions API)`. The vendor prefix (`zai-org/`) is in the id by design. A previous design considered a `parseFriendliAiId` helper to strip it; rejected by the maintainer. Don't reintroduce it without a new reason.

## Writing style

The README follows the Postman docs voice: action-led headings that include the target ("Install pi-friendliai," "Authenticate with FriendliAI"), step lists that follow `action → state confirmation` ("Run `/login`. Pi opens the provider picker."), section openers that lead with action + benefit, and no `please` / `pick` / hedge words. Match this voice when extending the README.

## Deferred

- npm publish.
- Feature requests upstream:
  - pi-mono: extension-exposed `ApiKeyCredential` registration API; using `package.json#name` for the `[Extensions]` display label.
