declare module "openclaw/plugin-sdk" {
	export interface OpenClawPluginApi {
		pluginConfig: unknown
		logger: {
			info: (msg: string) => void
			warn: (msg: string) => void
			error: (msg: string, ...args: unknown[]) => void
			debug: (msg: string) => void
		}
		config: unknown
		registerTool(tool: any, options: any): void
		registerCommand(command: any): void
		registerCli(handler: any, options?: any): void
		registerService(service: any): void
		on(event: string, handler: (...args: any[]) => any): void
	}

	export function stringEnum(values: readonly string[]): any
}
