import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import { CortexClient } from "./client.ts"
import { registerCliCommands } from "./commands/cli.ts"
import { registerSlashCommands } from "./commands/slash.ts"
import { cortexConfigSchema, parseConfig } from "./config.ts"
import { createIngestionHook } from "./hooks/capture.ts"
import { createRecallHook } from "./hooks/recall.ts"
import { log } from "./log.ts"
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

		log.setDebug(cfg.debug)

		const client = new CortexClient(cfg.apiKey, cfg.tenantId, cfg.subTenantId)

		let activeSessionKey: string | undefined
		const getSessionKey = () => activeSessionKey

		registerSearchTool(api, client, cfg)
		registerStoreTool(api, client, cfg, getSessionKey)

		if (cfg.autoRecall) {
			const onRecall = createRecallHook(client, cfg)
			api.on(
				"before_agent_start",
				(event: Record<string, unknown>, ctx: Record<string, unknown>) => {
					if (ctx.sessionKey) activeSessionKey = ctx.sessionKey as string
					return onRecall(event)
				},
			)
		}

		if (cfg.autoCapture) {
			api.on("agent_end", createIngestionHook(client, cfg, getSessionKey))
		}

		registerSlashCommands(api, client, cfg, getSessionKey)
		registerCliCommands(api, client, cfg)

		api.registerService({
			id: "openclaw-cortex-ai",
			start: () => log.info("plugin started"),
			stop: () => log.info("plugin stopped"),
		})
	},
}
