import type { CortexClient } from "../client.ts"
import type { CortexPluginConfig } from "../config.ts"
import { log } from "../log.ts"
import { toSourceId } from "../session.ts"
import type { ConversationTurn } from "../types/cortex.ts"

function textFromMessage(msg: Record<string, unknown>): string {
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
			.join("\n")
	}
	return ""
}

function getLatestTurn(messages: unknown[]): ConversationTurn | null {
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

function removeInjectedBlocks(text: string): string {
	return text.replace(/<cortex-context>[\s\S]*?<\/cortex-context>\s*/g, "").trim()
}

export function createIngestionHook(
	client: CortexClient,
	_cfg: CortexPluginConfig,
	getSessionKey: () => string | undefined,
) {
	return async (event: Record<string, unknown>) => {
		if (!event.success || !Array.isArray(event.messages) || event.messages.length === 0) return

		const turn = getLatestTurn(event.messages)
		if (!turn) return

		const userClean = removeInjectedBlocks(turn.user)
		const assistantClean = removeInjectedBlocks(turn.assistant)
		if (userClean.length < 5 || assistantClean.length < 5) return

		const sk = getSessionKey()
		const sourceId = sk ? toSourceId(sk) : undefined
		if (!sourceId) {
			log.debug("ingestion skipped — no session key")
			return
		}

		log.debug(`ingesting turn (u=${userClean.length}c, a=${assistantClean.length}c) → ${sourceId}`)

		try {
			await client.ingestConversation(
				[{ user: userClean, assistant: assistantClean }],
				sourceId,
			)
		} catch (err) {
			log.error("ingestion failed", err)
		}
	}
}
