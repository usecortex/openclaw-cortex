import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import { CortexClient } from "./client.ts"
import { registerCliCommands } from "./commands/cli.ts"
import { registerSlashCommands } from "./commands/slash.ts"
import { cortexConfigSchema, parseConfig } from "./config.ts"
import { createIngestionHook } from "./hooks/capture.ts"
import { createRecallHook } from "./hooks/recall.ts"
import { log } from "./log.ts"
import { registerDeleteTool } from "./tools/delete.ts"
import { registerGetTool } from "./tools/get.ts"
import { registerListTool } from "./tools/list.ts"
import { registerSearchTool } from "./tools/search.ts"
import { registerStoreTool } from "./tools/store.ts"

export default {
	id: "openclaw-cortex-ai",
	name: "Cortex AI",
	description:
		"Long-term memory for OpenClaw powered by Cortex AI — auto-capture, recall, and graph-enriched context",
	kind: "memory" as const,
	configSchema: cortexConfigSchema,

	register(api: OpenClawPluginApi) {
		const cfg = parseConfig(api.pluginConfig)

		log.init(api.logger, cfg.debug)

		const client = new CortexClient(cfg.apiKey, cfg.tenantId, cfg.subTenantId)

		let activeSessionId: string | undefined
		let conversationMessages: unknown[] = []
		const getSessionId = () => activeSessionId
		const getMessages = () => conversationMessages

		registerSearchTool(api, client, cfg)
		registerStoreTool(api, client, cfg, getSessionId, getMessages)
		registerListTool(api, client, cfg)
		registerDeleteTool(api, client, cfg)
		registerGetTool(api, client, cfg)

		if (cfg.autoRecall) {
			const onRecall = createRecallHook(client, cfg)
			api.on(
				"before_agent_start",
				(event: Record<string, unknown>, ctx: Record<string, unknown>) => {
					if (ctx.sessionId) activeSessionId = ctx.sessionId as string
					if (Array.isArray(event.messages)) conversationMessages = event.messages
					log.debug(`[session] before_agent_start — sid=${activeSessionId ?? "none"} msgs=${conversationMessages.length}`)
					return onRecall(event)
				},
			)
		}

		if (cfg.autoCapture) {
			const captureHandler = createIngestionHook(client, cfg)
			api.on(
				"agent_end",
				(event: Record<string, unknown>, ctx: Record<string, unknown>) => {
					if (ctx.sessionId) activeSessionId = ctx.sessionId as string
					log.debug(`[session] agent_end — sid=${activeSessionId ?? "none"} ctxKeys=${Object.keys(ctx).join(",")}`)
					return captureHandler(event, activeSessionId)
				},
			)
		}

		registerSlashCommands(api, client, cfg, getSessionId)
		registerCliCommands(api, client, cfg)

		api.registerService({
			id: "openclaw-cortex-ai",
			start: () => log.info("plugin started"),
			stop: () => log.info("plugin stopped"),
		})
	},
}
