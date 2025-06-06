import type {ProjectAPIContext} from "./ProjectAPIContext.d.mts"
import type {ProjectAPI} from "./ProjectAPI.mts"
import {_generateProjectAPIFromContextPartial} from "./_generateProjectAPIFromContextPartial.mts"
import {getEmbedAsURLNodeFactory} from "./getEmbedAsURLNodeFactory.mts"

export async function generateProjectAPIFromContextNode(
	context: ProjectAPIContext
): Promise<ProjectAPI> {
	return {
		...await _generateProjectAPIFromContextPartial(context),
		getEmbedAsURL: getEmbedAsURLNodeFactory(context)
	}
}
