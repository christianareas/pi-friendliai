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
| `deepseek-ai/DeepSeek-V3.2` | 163,840 | 163,840 | 0.5 | 1.5 | 0.25 |
| `LGAI-EXAONE/K-EXAONE-236B-A23B` | 262,144 | 262,144 | 0.2 | 0.8 | 0.1 |
| `meta-llama/Llama-3.1-8B-Instruct` | 131,072 | 8,000 | 0.1 | 0.1 | — |
| `meta-llama/Llama-3.3-70B-Instruct` | 131,072 | 131,072 | 0.6 | 0.6 | — |
| `MiniMaxAI/MiniMax-M2.5` | 196,608 | 196,608 | 0.3 | 1.2 | 0.06 |
| `Qwen/Qwen3-235B-A22B-Instruct-2507` | 262,144 | 262,144 | 0.2 | 0.8 | — |
| `zai-org/GLM-5` | 202,752 | 202,752 | 1.0 | 3.2 | 0.5 |
| `zai-org/GLM-5.1` | 202,752 | 202,752 | 1.4 | 4.4 | 0.26 |

Values come from FriendliAI's serverless catalog (`https://api.friendli.ai/serverless/v1/models`) as of 2026-06-13. `reasoning` and `input` are not in the catalog — see [Known limitations](#known-limitations).

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
      "apiKey": "$FRIENDLIAI_API_TOKEN",
      "authHeader": true,
      "models": [
        {
          "id": "zai-org/GLM-5.1",
          "name": "GLM-5.1 (custom)",
          "reasoning": true,
          "input": ["text"],
          "cost": { "input": 1.4, "output": 4.4, "cacheRead": 0.26, "cacheWrite": 0 },
          "contextWindow": 202752,
          "maxTokens": 202752
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

- **`reasoning` is inferred.** FriendliAI's catalog doesn't indicate whether a model is a reasoning model, so the `reasoning` flag is set per model by hand. `deepseek-ai/DeepSeek-V3.2`, `LGAI-EXAONE/K-EXAONE-236B-A23B`, and `MiniMaxAI/MiniMax-M2.5` are set to `true` but unverified; correct them if FriendliAI's behavior differs.
- **"No models available" warning at startup.** Pi prints this warning before extensions register their providers. The providers do appear; the warning is harmless.

## Contribute to pi-friendliai

To add or update a model, edit `models.json`. Both providers register the new entry automatically. Verify `cost`, `contextWindow`, and `maxTokens` against FriendliAI's serverless catalog at <https://api.friendli.ai/serverless/v1/models> and note the verification date in the pull request description.

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
