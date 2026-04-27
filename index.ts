// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent"
import { models } from "./models"

// --------------------------------------------------------------------------------
// Types.
// --------------------------------------------------------------------------------

interface Provider {
	name: string
	apiBaseUrl: string
	api: "openai-completions" | "anthropic-messages"
	apiLabel: string
}

// --------------------------------------------------------------------------------
// Providers.
// --------------------------------------------------------------------------------

const providers: Provider[] = [
	{
		name: "friendliai-chat-completions",
		apiBaseUrl: "https://api.friendli.ai/serverless/v1",
		api: "openai-completions",
		apiLabel: "FriendliAI's Chat Completions API",
	},
	{
		name: "friendliai-messages",
		apiBaseUrl: "https://api.friendli.ai/serverless",
		api: "anthropic-messages",
		apiLabel: "FriendliAI's Messages API",
	},
]

// --------------------------------------------------------------------------------
// Register providers.
// --------------------------------------------------------------------------------

// When Pi loads the extension, register the providers.
export default function (pi: ExtensionAPI) {
	let providersRegistered = false

	// When the session starts, register the providers.
	pi.on("session_start", (_event, context) => {
		// If the providers are registered, exit (guards against false positives and noise).
		if (providersRegistered) return

		for (const provider of providers) {
			// If the provider's registered, warn the user and skip to the next provider.
			if (
				context.modelRegistry
					.getAll()
					.some((model) => model.provider === provider.name)
			) {
				context.ui.notify(
					`[pi-friendliai] ${provider.name} is configured in your ~/.pi/agent/models.json. Skipping the extension's provider in favor of yours.`,
					"warning",
				)
				continue
			}

			// Otherwise, register the provider.
			pi.registerProvider(provider.name, {
				baseUrl: provider.apiBaseUrl,
				apiKey: "FRIENDLIAI_API_TOKEN",
				// apiKey: "!security find-generic-password -ws 'friendliai'",
				api: provider.api,
				authHeader: true,
				models: models.map((model) => ({
					id: model.id,
					name: `${model.id} (${provider.apiLabel})`,
					reasoning: model.reasoning,
					input: model.input,
					cost: model.cost,
					contextWindow: model.contextWindow,
					maxTokens: model.maxTokens,
				})),
			})
		}

		providersRegistered = true
	})
}

// --------------------------------------------------------------------------------
