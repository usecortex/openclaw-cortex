export function toSourceId(sessionKey: string): string {
	return `openclaw_cortex_sess_${sessionKey.replace(/\W+/g, "_")}`
}
