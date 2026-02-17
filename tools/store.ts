import { Type } from "@sinclair/typebox"
import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { CortexClient } from "../client.ts"
import type { CortexPluginConfig } from "../config.ts"
import { log } from "../log.ts"
import { toSourceId } from "../session.ts"

export function registerStoreTool(
	api: OpenClawPluginApi,
	client: CortexClient,
	_cfg: CortexPluginConfig,
	getSessionId: () => string | undefined,
): void {
	api.registerTool(
		{
			name: "cortex_store",
			label: "Cortex Store",
			description:
				"Save important information to Cortex long-term memory. Use this to persist facts, preferences, or decisions the user wants remembered.",
			parameters: Type.Object({
				text: Type.String({
					description: "The information to store in memory",
				}),
				title: Type.Optional(
					Type.String({
						description: "Optional title for the memory entry",
					}),
				),
			}),
			async execute(
				_toolCallId: string,
				params: { text: string; title?: string },
			) {
				const sid = getSessionId()
				const sourceId = sid ? toSourceId(sid) : undefined

				log.debug(`store tool: "${params.text.slice(0, 50)}" - \nsourceId: ${sourceId}`)

				await client.ingestText(params.text, {
					sourceId,
					title: params.title ?? "Agent Memory",
					infer: true,
				})

				const preview =
					params.text.length > 80
						? `${params.text.slice(0, 80)}…`
						: params.text

				return {
					content: [
						{
							type: "text" as const,
							text: `Saved to Cortex: "${preview}"`,
						},
					],
				}
			},
		},
		{ name: "cortex_store" },
	)
}
