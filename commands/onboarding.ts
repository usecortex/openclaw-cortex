import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { CortexClient } from "../client.ts"
import type { CortexPluginConfig } from "../config.ts"
import { log } from "../log.ts"

function mask(value: string, visibleChars = 4): string {
	if (value.length <= visibleChars) return "****"
	return `${"*".repeat(value.length - visibleChars)}${value.slice(-visibleChars)}`
}

function check(ok: boolean): string {
	return ok ? "[OK]" : "[!!]"
}

function basicStatus(cfg: CortexPluginConfig, client: CortexClient): string {
	const lines: string[] = [
		"=== Cortex AI — Setup ===",
		"",
		"  Essential configuration:",
		"",
		`  ${check(!!cfg.apiKey)}  API Key:       ${cfg.apiKey ? mask(cfg.apiKey) : "NOT SET"}`,
		`       Set via: CORTEX_OPENCLAW_API_KEY env var or "apiKey" in plugin config`,
		"",
		`  ${check(!!cfg.tenantId)}  Tenant ID:     ${cfg.tenantId ? mask(cfg.tenantId, 8) : "NOT SET"}`,
		`       Set via: CORTEX_OPENCLAW_TENANT_ID env var or "tenantId" in plugin config`,
		"",
		`  [  ]  Sub-Tenant:    ${client.getSubTenantId()}`,
		`       Set via: "subTenantId" in plugin config (default: cortex-openclaw-plugin)`,
		"",
		`  [  ]  Ignore Term:   ${cfg.ignoreTerm}`,
		`       Set via: "ignoreTerm" in plugin config (default: cortex-ignore)`,
		`       Messages containing this term will be excluded from recall & capture.`,
		"",
		"  Tip: Use /cortex-setup-advanced to see all configuration options.",
	]

	return lines.join("\n")
}

function advancedStatus(cfg: CortexPluginConfig, client: CortexClient): string {
	const lines: string[] = [
		"=== Cortex AI — Advanced Setup ===",
		"",
		"  Credentials:",
		`    API Key:          ${cfg.apiKey ? mask(cfg.apiKey) : "NOT SET"}`,
		`    Tenant ID:        ${cfg.tenantId ? mask(cfg.tenantId, 8) : "NOT SET"}`,
		`    Sub-Tenant ID:    ${client.getSubTenantId()}`,
		"",
		"  Behaviour:",
		`    Auto-Recall:      ${cfg.autoRecall}`,
		`    Auto-Capture:     ${cfg.autoCapture}`,
		`    Ignore Term:      ${cfg.ignoreTerm}`,
		"",
		"  Recall:",
		`    Max Results:      ${cfg.maxRecallResults}`,
		`    Recall Mode:      ${cfg.recallMode}`,
		`    Graph Context:    ${cfg.graphContext}`,
		"",
		"  Debug:",
		`    Debug Logging:    ${cfg.debug}`,
		"",
		"  All options can be set in the plugin config object (openclaw.plugin.json).",
		"  Env vars and ${VAR} syntax are supported for apiKey and tenantId.",
	]

	return lines.join("\n")
}

export function registerOnboardingCommands(
	api: OpenClawPluginApi,
	client: CortexClient,
	cfg: CortexPluginConfig,
): void {
	api.registerCommand({
		name: "cortex-setup",
		description: "Show Cortex plugin setup status and essential configuration guide",
		acceptsArgs: false,
		requireAuth: false,
		handler: async () => {
			try {
				return { text: basicStatus(cfg, client) }
			} catch (err) {
				log.error("/cortex-setup", err)
				return { text: "Failed to generate setup status. Check logs." }
			}
		},
	})

	api.registerCommand({
		name: "cortex-setup-advanced",
		description: "Show all Cortex plugin configuration options and their current values",
		acceptsArgs: false,
		requireAuth: false,
		handler: async () => {
			try {
				return { text: advancedStatus(cfg, client) }
			} catch (err) {
				log.error("/cortex-setup-advanced", err)
				return { text: "Failed to generate advanced setup status. Check logs." }
			}
		},
	})
}
