import type {API} from "#~src/API.d.mts"
import type {APIContext} from "#~src/APIContext.d.mts"

const impl: API["projectSourceFileFilter"] = async function(
	this: APIContext, _, file
) {
	if (file.fileName.endsWith(".d.mts")) {
		return false
	}

	return file.fileName.endsWith(".mts")
}

export const projectSourceFileFilter = impl
