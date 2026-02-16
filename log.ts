const TAG = "[cortex-ai]"

let _debug = false

export const log = {
	setDebug(enabled: boolean) {
		_debug = enabled
	},

	info(...args: unknown[]) {
		console.log(TAG, ...args)
	},

	warn(...args: unknown[]) {
		console.warn(TAG, ...args)
	},

	error(...args: unknown[]) {
		console.error(TAG, ...args)
	},

	debug(...args: unknown[]) {
		if (_debug) console.debug(TAG, ...args)
	},
}
