export type CortexPluginConfig = {
	apiKey: string
	tenantId: string
	subTenantId: string
	autoRecall: boolean
	autoCapture: boolean
	maxRecallResults: number
	recallMode: "fast" | "thinking"
	graphContext: boolean
	debug: boolean
}

const KNOWN_KEYS = new Set([
	"apiKey",
	"tenantId",
	"subTenantId",
	"autoRecall",
	"autoCapture",
	"maxRecallResults",
	"recallMode",
	"graphContext",
	"debug",
])

const DEFAULT_SUB_TENANT = "cortex-openclaw-plugin"

function envOrNull(name: string): string | undefined {
	return typeof process !== "undefined" ? process.env[name] : undefined
}

function resolveEnvVars(value: string): string {
	return value.replace(/\$\{([^}]+)\}/g, (_, name: string) => {
		const val = envOrNull(name)
		if (!val) throw new Error(`Environment variable ${name} is not set`)
		return val
	})
}

export function parseConfig(raw: unknown): CortexPluginConfig {
	const cfg =
		raw && typeof raw === "object" && !Array.isArray(raw)
			? (raw as Record<string, unknown>)
			: {}

	const unknown = Object.keys(cfg).filter((k) => !KNOWN_KEYS.has(k))
	if (unknown.length > 0) {
		throw new Error(`cortex-ai: unrecognized config keys: ${unknown.join(", ")}`)
	}

	const apiKey =
		typeof cfg.apiKey === "string" && cfg.apiKey.length > 0
			? resolveEnvVars(cfg.apiKey)
			: envOrNull("CORTEX_OPENCLAW_API_KEY")

	if (!apiKey) {
		throw new Error(
			"cortex-ai: apiKey is required — set it in plugin config or via CORTEX_OPENCLAW_API_KEY env var",
		)
	}

	const tenantId =
		typeof cfg.tenantId === "string" && cfg.tenantId.length > 0
			? resolveEnvVars(cfg.tenantId)
			: envOrNull("CORTEX_OPENCLAW_TENANT_ID")

	if (!tenantId) {
		throw new Error(
			"cortex-ai: tenantId is required — set it in plugin config or via CORTEX_OPENCLAW_TENANT_ID env var",
		)
	}

	const subTenantId =
		typeof cfg.subTenantId === "string" && cfg.subTenantId.length > 0
			? cfg.subTenantId
			: DEFAULT_SUB_TENANT

	return {
		apiKey,
		tenantId,
		subTenantId,
		autoRecall: (cfg.autoRecall as boolean) ?? true,
		autoCapture: (cfg.autoCapture as boolean) ?? true,
		maxRecallResults: (cfg.maxRecallResults as number) ?? 10,
		recallMode:
			cfg.recallMode === "thinking"
				? ("thinking" as const)
				: ("fast" as const),
		graphContext: (cfg.graphContext as boolean) ?? true,
		debug: (cfg.debug as boolean) ?? false,
	}
}

export const cortexConfigSchema = {
	parse: parseConfig,
}
