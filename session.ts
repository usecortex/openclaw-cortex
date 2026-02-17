export function toSourceId(sessionId: string): string {
	return `oc_sess_${sessionId}`
}

export function toHookSourceId(sessionId: string): string {
	return `oc_hook_${sessionId}`
}

export function toToolSourceId(sessionId: string): string {
	return `oc_tool_${sessionId}`
}
