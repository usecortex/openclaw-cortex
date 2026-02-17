import type { CortexClient } from "../client.ts"
import type { CortexPluginConfig } from "../config.ts"
import { log } from "../log.ts"
import { getLatestTurn } from "../messages.ts"
import { toHookSourceId } from "../session.ts"

function removeInjectedBlocks(text: string): string {
	return text.replace(/<cortex-context>[\s\S]*?<\/cortex-context>\s*/g, "").trim()
}

export function createIngestionHook(
	client: CortexClient,
	_cfg: CortexPluginConfig,
) {
	return async (event: Record<string, unknown>, sessionId: string | undefined) => {
		try {
			log.debug(`[capture] hook fired — success=${event.success} msgs=${Array.isArray(event.messages) ? event.messages.length : "N/A"} sid=${sessionId ?? "none"}`)

			if (!event.success) {
				log.debug("[capture] skipped — event.success is falsy")
				return
			}
			if (!Array.isArray(event.messages) || event.messages.length === 0) {
				log.debug("[capture] skipped — no messages in event")
				return
			}

			const turn = getLatestTurn(event.messages)
			if (!turn) {
				log.debug(`[capture] skipped — could not extract user-assistant turn from ${event.messages.length} messages`)
				const roles = event.messages
					.slice(-5)
					.map((m) => (m && typeof m === "object" ? (m as Record<string, unknown>).role : "?"))
				log.debug(`[capture] last 5 message roles: ${JSON.stringify(roles)}`)
				return
			}

			const userClean = removeInjectedBlocks(turn.user)
			const assistantClean = removeInjectedBlocks(turn.assistant)

			if (userClean.length < 5 || assistantClean.length < 5) {
				log.debug(`[capture] skipped — text too short (u=${userClean.length}c, a=${assistantClean.length}c)`)
				return
			}

			if (!sessionId) {
				log.debug("[capture] skipped — no session id available")
				return
			}

			const sourceId = toHookSourceId(sessionId)

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

			log.debug(`[capture] ingesting turn @ ${timestamp} (u=${userClean.length}c, a=${assistantClean.length}c) -> ${sourceId}`)

			await client.ingestConversation(
				[{ user: timedUser, assistant: assistantClean }],
				sourceId,
				{
					metadata: {
						captured_at: timestamp,
						source: "openclaw_hook",
					},
				},
			)

			log.debug("[capture] ingestion succeeded")
		} catch (err) {
			log.error("[capture] hook error", err)
		}
	}
}
