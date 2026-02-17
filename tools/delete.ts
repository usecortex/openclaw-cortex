import { Type } from "@sinclair/typebox"
import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { CortexClient } from "../client.ts"
import type { CortexPluginConfig } from "../config.ts"
import { log } from "../log.ts"

export function registerDeleteTool(
	api: OpenClawPluginApi,
	client: CortexClient,
	_cfg: CortexPluginConfig,
): void {
	api.registerTool(
		{
			name: "cortex_delete_memory",
			label: "Cortex Delete Memory",
			description:
				"Delete a specific memory from Cortex by its memory ID. Use this when the user explicitly asks you to forget something or remove a specific piece of stored information. Always confirm the memory ID before deleting.",
			parameters: Type.Object({
				memory_id: Type.String({
					description: "The unique ID of the memory to delete",
				}),
			}),
			async execute(
				_toolCallId: string,
				params: { memory_id: string },
			) {
				log.debug(`delete tool: memory_id=${params.memory_id}`)

				const res = await client.deleteMemory(params.memory_id)

				if (res.user_memory_deleted) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Successfully deleted memory: ${params.memory_id}`,
							},
						],
					}
				}

				return {
					content: [
						{
							type: "text" as const,
							text: `Memory ${params.memory_id} was not found or has already been deleted.`,
						},
					],
				}
			},
		},
		{ name: "cortex_delete_memory" },
	)
}
