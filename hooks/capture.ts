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
	getSessionId: () => string | undefined,
) {
	return async (event: Record<string, unknown>) => {
		if (!event.success || !Array.isArray(event.messages) || event.messages.length === 0) return

		const turn = getLatestTurn(event.messages)
		if (!turn) return

		const userClean = removeInjectedBlocks(turn.user)
		const assistantClean = removeInjectedBlocks(turn.assistant)
		if (userClean.length < 5 || assistantClean.length < 5) return

		const sid = getSessionId()
		const sourceId = sid ? toSourceId(sid) : undefined
		if (!sourceId) {
			log.debug("ingestion skipped — no session id")
			return
		}

		const now = new Date()
		const timestamp = now.toISOString()
		const readableTime = now.toLocaleString("en-US", {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZoneName: "short",
		})

		const timedUser = `[Temporal details: ${readableTime}]\n\n${userClean}`

		log.debug(`ingesting turn @ ${timestamp} (u=${userClean.length}c, a=${assistantClean.length}c) -> ${sourceId}`)

		try {
			await client.ingestConversation(
				[{ user: timedUser, assistant: assistantClean }],
				sourceId,
				{
					metadata: {
						captured_at: timestamp,
						source: "openclaw",
					},
				},
			)
		} catch (err) {
			log.error("ingestion failed", err)
		}
	}
}
