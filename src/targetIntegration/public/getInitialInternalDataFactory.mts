import type {API} from "#~src/targetIntegration/API.d.mts"
import type {APIContext} from "#~src/targetIntegration/APIContext.d.mts"
import crypto from "node:crypto"

function sha256Sync(str: string): string {
	const hash = crypto.createHash("sha256")

	return hash.update(str).digest("hex").toLowerCase()
}

const impl: API["getInitialInternalData"] = async function(
	this: APIContext, earlySession
) {
	const projectId = sha256Sync(
		`${earlySession.project.packageJSON.name}@${earlySession.project.packageJSON.version}`
	)

	return {
		entryPoints: new Map(),
		projectId
	}
}

export function getInitialInternalDataFactory(context: APIContext) {
	return impl!.bind(context)
}
