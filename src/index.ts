// --------------------------------------------------------------------------------
// Dependencies.
// --------------------------------------------------------------------------------

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent"
import { models } from "./models"

// --------------------------------------------------------------------------------
// Types.
// --------------------------------------------------------------------------------

type Provider = {
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
		apiLabel: "FriendliAI's Anthropic Messages API",
	},
]

// --------------------------------------------------------------------------------
// Register providers.
// --------------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	for (const provider of providers) {
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
}

// --------------------------------------------------------------------------------
