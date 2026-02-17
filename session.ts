export function toSourceId(sessionId: string): string {
	return `sess_${sessionId}`
}

export function toHookSourceId(sessionId: string): string {
	return `hook_${sessionId}`
}

export function toToolSourceId(sessionId: string): string {
	return `tool_${sessionId}`
}
