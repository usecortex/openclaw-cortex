import type { ConversationTurn } from "./types/cortex.ts"

export function textFromMessage(msg: Record<string, unknown>): string {
	const content = msg.content
	if (typeof content === "string") return content
	if (Array.isArray(content)) {
		return content
			.filter(
				(b) =>
					b &&
					typeof b === "object" &&
					(b as Record<string, unknown>).type === "text",
			)
			.map((b) => (b as Record<string, unknown>).text as string)
			.filter(Boolean)
			.join("\n")
	}
	return ""
}

export function extractAllTurns(messages: unknown[]): ConversationTurn[] {
	const turns: ConversationTurn[] = []
	let i = 0
	while (i < messages.length) {
		const msg = messages[i]
		if (!msg || typeof msg !== "object") {
			i++
			continue
		}
		const m = msg as Record<string, unknown>
		if (m.role === "user") {
			const userText = textFromMessage(m)
			if (userText) {
				for (let j = i + 1; j < messages.length; j++) {
					const next = messages[j]
					if (!next || typeof next !== "object") continue
					const n = next as Record<string, unknown>
					if (n.role === "assistant") {
						const assistantText = textFromMessage(n)
						if (assistantText) {
							turns.push({ user: userText, assistant: assistantText })
							i = j + 1
							break
						}
					}
					if (n.role === "user") break
				}
			}
		}
		i++
	}
	return turns
}

export function getLatestTurn(messages: unknown[]): ConversationTurn | null {
	let userIdx = -1
	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i]
		if (m && typeof m === "object" && (m as Record<string, unknown>).role === "user") {
			userIdx = i
			break
		}
	}
	if (userIdx < 0) return null

	const userText = textFromMessage(messages[userIdx] as Record<string, unknown>)
	if (!userText) return null

	for (let i = userIdx + 1; i < messages.length; i++) {
		const m = messages[i]
		if (m && typeof m === "object" && (m as Record<string, unknown>).role === "assistant") {
			const aText = textFromMessage(m as Record<string, unknown>)
			if (aText) return { user: userText, assistant: aText }
		}
	}
	return null
}
