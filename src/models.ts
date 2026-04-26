// --------------------------------------------------------------------------------
// Types.
// --------------------------------------------------------------------------------

export interface FriendliAiModel {
	id: string
	reasoning: boolean
	input: Array<"text" | "image">
	cost: {
		input: number
		output: number
		cacheRead: number
		cacheWrite: number
	}
	contextWindow: number
	maxTokens: number
}

// --------------------------------------------------------------------------------
// Models
// --------------------------------------------------------------------------------

export const models: FriendliAiModel[] = [
	{
		id: "zai-org/GLM-5.1",
		reasoning: true,
		input: ["text"],
		cost: {
			input: 1.4,
			output: 4.4,
			cacheRead: 0.26,
			cacheWrite: 0,
		},
		// todo: confirm contextWindow and maxTokens are accurate.
		contextWindow: 200000,
		maxTokens: 32000,
	},
	{
		id: "zai-org/GLM-5",
		reasoning: true,
		input: ["text"],
		cost: {
			input: 1.0,
			output: 3.2,
			cacheRead: 0.5,
			cacheWrite: 0,
		},
		// todo: confirm contextWindow and maxTokens are accurate.
		contextWindow: 200000,
		maxTokens: 32000,
	},
]

// --------------------------------------------------------------------------------
