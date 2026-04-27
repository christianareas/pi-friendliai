// ----------------------------------------------------------------------------
// Dependencies.
// ----------------------------------------------------------------------------

import modelsJson from "./models.json" with { type: "json" }

// ----------------------------------------------------------------------------
// Types.
// ----------------------------------------------------------------------------

interface Model {
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

// ----------------------------------------------------------------------------
// Models
// ----------------------------------------------------------------------------

export const models = modelsJson as Model[] // ** todo: confirm contextWindow and maxTokens are accurate. **

// ----------------------------------------------------------------------------
