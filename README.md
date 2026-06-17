# pi-friendliai

`pi-friendliai` is a [Pi](https://pi.dev) [extension](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs/custom-provider.md) that adds [FriendliAI](https://friendli.ai)'s serverless models to Pi. Install it, authenticate, and call any FriendliAI model from Pi's model chooser.

The extension registers two providers that serve the same models over different protocols:

- **`friendliai-chat-completions`** — FriendliAI's OpenAI-compatible Chat Completions endpoint.
- **`friendliai-messages`** — FriendliAI's Anthropic-compatible Messages endpoint.

Choose the protocol that matches your workflow.

## Install pi-friendliai

Install pi-friendliai globally to make FriendliAI's models available in every Pi session:

```bash
pi install git:github.com/christianareas/pi-friendliai
```

To scope the extension to a single project, add the `-l` flag. Pi creates a `.pi/` directory next to your project:

```bash
pi install git:github.com/christianareas/pi-friendliai -l
```

## Use Pi with FriendliAI

Set up Pi to connect to FriendliAI. Once you complete these steps, Pi will send requests to FriendliAI.

### Create a Friendli Suite Account

If you haven't already, [sign up](https://auth.friendli.ai/sign-up) for an account.

### Sign In

Then, [sign in](https://auth.friendli.ai/). Friendli Suite opens your dashboard.

### Create a FriendliAI API Key

1. In the left sidebar, click **Settings**. Then, click **API Keys**.

2. In the upper-right corner, click **Create API Key**.

3. Click **Copy**.

### Set Up Pi

1. In your terminal, run the following command:

   ```bash
   pi
   ```

   Pi opens.

2. Run the following Pi slash command:

   ```bash
   /login
   ```

3. Select **Use an API Key**.

4. Choose `friendliai-chat-completions` or `friendliai-messages`.

5. Paste your API key. Pi stores it in `~/.pi/agent/auth.json`.

6. Run the following Pi slash command:

   ```bash
   /model
   ```

7. Choose a model.

You're ready to send your first prompt.

### Authenticate with an Environment Variable

For headless setups, CI, or shared machines, set your API key as an environment variable instead:

```bash
export FRIENDLIAI_API_TOKEN=your-token-here
```

Pi reads `FRIENDLIAI_API_TOKEN` whenever no stored credential exists.

## Available Models

Run `/model` in Pi to switch to a FriendliAI model. The extension ships with FriendliAI's serverless catalog, available under both providers:

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
| `zai-org/GLM-5.2` | 1,048,576 | 1,048,576 | 1.4 | 4.4 | 0.26 |

Values come from FriendliAI's serverless catalog (`https://api.friendli.ai/serverless/v1/models`) as of 2026-06-16. The `reasoning` and `input` fields aren't in the catalog — see [Known Limitations](#known-limitations).

## Override or Extend the Defaults

Define `friendliai-chat-completions` or `friendliai-messages` in your `~/.pi/agent/models.json` to take over a provider. The extension detects the conflict, defers entirely to your configuration for that provider, and notifies you on session start.

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

Conflict detection runs per provider. Overriding `friendliai-chat-completions` leaves the extension's defaults for `friendliai-messages` untouched.

## Apply Your Changes

> [!IMPORTANT]
> Restart Pi to load any change — to your `~/.pi/agent/models.json`, to the extension, or after you install a new version. A new session inside a running Pi process keeps the existing in-memory state and misses the change.

## Known Limitations

> [!WARNING]
> **Reasoning models fail on the `friendliai-messages` provider.** FriendliAI's Anthropic-compatible Messages API rejects the `thinking.display` field Pi sends for reasoning models and returns `422 invalid_request_error` ("no such field: 'display'"). This affects every model with `reasoning: true` — the GLM, DeepSeek, K-EXAONE, and MiniMax entries. Run them under `friendliai-chat-completions` instead; the Llama and Qwen entries work on either provider. Reported to FriendliAI.

- **`reasoning` is inferred.** FriendliAI's catalog doesn't say whether a model reasons, so the extension sets each `reasoning` flag by hand. `deepseek-ai/DeepSeek-V3.2`, `LGAI-EXAONE/K-EXAONE-236B-A23B`, `MiniMaxAI/MiniMax-M2.5`, and `zai-org/GLM-5.2` are set to `true` but unverified; correct them if FriendliAI's behavior differs.
- **Two models are scheduled for deprecation.** FriendliAI dates `meta-llama/Llama-3.1-8B-Instruct` and `meta-llama/Llama-3.3-70B-Instruct` for deprecation on 2026-06-26. They stop responding after that.
- **Pi warns "No models available" at startup.** Pi prints this warning before the extension registers its providers. The providers still load; the warning is harmless.

## Contribute to pi-friendliai

Add or update a model by editing `models.json` — both providers register the change automatically. Verify `cost`, `contextWindow`, and `maxTokens` against FriendliAI's serverless catalog at <https://api.friendli.ai/serverless/v1/models>, and note the verification date in your pull request.

### Run pi-friendliai Locally

```bash
git clone https://github.com/christianareas/pi-friendliai
cd pi-friendliai
npm install
pi -e $(pwd)
```

### Run the Checks

```bash
npm run ts:check          # Type-check with tsc
npm run biome:check       # Lint and format
npm run biome:check:write # Apply lint and format fixes
```

## License

MIT — see [LICENSE](LICENSE).
