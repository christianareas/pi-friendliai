# pi-friendliai

`pi-friendliai` is a [Pi](https://pi.dev) [extension](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs/custom-provider.md) that adds [FriendliAI](https://friendli.ai) models to your Pi.

- `friendliai-chat-completions` — FriendliAI's OpenAI-compatible chat completions endpoint
- `friendliai-messages` — FriendliAI's Anthropic-compatible messages endpoint

Both providers serve the same models. Choose the protocol that matches your workflow.

## Install pi-friendliai

Install pi-friendliai globally:

```bash
pi install git:github.com/christianareas/pi-friendliai
```

To install for a single project, add the `-l` flag. Pi creates a `.pi/` directory next to your project:

```bash
pi install git:github.com/christianareas/pi-friendliai -l
```

## Authenticate with FriendliAI

Generate a personal access token at <https://friendli.ai/suite/setting/tokens>, then authenticate from inside Pi:

1. Run `/login`. Pi opens the provider picker.
2. Select a FriendliAI provider, then choose **API Key**.
3. Paste your token. Pi stores it in `~/.pi/agent/auth.json` and reuses it on subsequent launches.

Authenticate each provider separately.

### Use an environment variable

Set `FRIENDLIAI_API_TOKEN` in your environment:

```bash
export FRIENDLIAI_API_TOKEN=your-token-here
```

Pi reads this value when no stored credential exists. Use this approach for headless setups, CI, or shared machines.

## Models

`pi-friendliai` ships with the following models, available under both providers:

| Model ID | Context | Max output | Input ($/1M) | Output ($/1M) | Cache read ($/1M) |
|---|---|---|---|---|---|
| `zai-org/GLM-5.1` | 200,000 | 32,000 | 1.4 | 4.4 | 0.26 |
| `zai-org/GLM-5` | 200,000 | 32,000 | 1.0 | 3.2 | 0.5 |

Pricing reflects FriendliAI's per-model pages as of 2026-04-26. Context window and max output values are conservative estimates — see [Known limitations](#known-limitations).

In Pi, run `/model` to switch to a FriendliAI model.

## Override or extend the defaults

Define `friendliai-chat-completions` or `friendliai-messages` in your `~/.pi/agent/models.json` to override the extension's defaults. The extension detects the conflict, defers entirely to your configuration for that provider, and notifies you on session start.

For example, to override the pricing for `zai-org/GLM-5.1`:

```json
{
  "providers": {
    "friendliai-chat-completions": {
      "baseUrl": "https://api.friendli.ai/serverless/v1",
      "api": "openai-completions",
      "apiKey": "FRIENDLIAI_API_TOKEN",
      "authHeader": true,
      "models": [
        {
          "id": "zai-org/GLM-5.1",
          "name": "GLM-5.1 (custom)",
          "reasoning": true,
          "input": ["text"],
          "cost": { "input": 1.4, "output": 4.4, "cacheRead": 0.26, "cacheWrite": 0 },
          "contextWindow": 200000,
          "maxTokens": 32000
        }
      ]
    }
  }
}
```

Conflict detection runs per provider. Configuring `friendliai-chat-completions` does not affect the extension's defaults for `friendliai-messages`.

## Apply your changes

Restart Pi after any update — to your `models.json`, the extension itself, or after installing a new version. New sessions within a running Pi process inherit the existing in-memory state and miss the changes.

## Known limitations

- **`contextWindow` and `maxTokens` are unverified.** FriendliAI does not publish per-model context or output limits. The values shipped here are conservative; HuggingFace `config.json` reports an architectural ceiling of 202,752 tokens for both models, but FriendliAI's served limits may differ.
- **No machine-readable model catalog.** FriendliAI does not expose a `/v1/models` endpoint or a JSON pricing catalog on serverless. Model and pricing data in this extension is hand-maintained.
- **"No models available" warning at startup.** Pi prints this warning before extensions register their providers. The providers do appear; the warning is harmless.

## Contribute to pi-friendliai

To add or update a model, edit `models.json`. Both providers register the new entry automatically. Verify pricing against the model's page at <https://friendli.ai/models> and note the verification date in the pull request description.

### Run pi-friendliai locally

```bash
git clone https://github.com/christianareas/pi-friendliai
cd pi-friendliai
npm install
pi -e $(pwd)
```

### Run checks

```bash
npm run ts:check          # TypeScript
npm run biome:check       # Lint and format
npm run biome:check:write # Apply lint/format fixes
```

## License

MIT — see [LICENSE](LICENSE).
