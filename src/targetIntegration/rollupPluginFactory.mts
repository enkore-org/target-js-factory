import type {EnkoreSessionAPI} from "@enkore/spec"
import type {JsBundlerOptions} from "@enkore-types/rollup"
import type {APIContext} from "./APIContext.d.mts"
import type {InternalData} from "./InternalData.d.mts"
import {getRequestedEmbeds} from "./getRequestedEmbeds.mts"

type Factory = NonNullable<JsBundlerOptions["additionalPlugins"]>[number]
type MapValueType<A> = A extends Map<any, infer V> ? V : never;

export async function rollupPluginFactory(
	session: EnkoreSessionAPI,
	apiContext: APIContext,
	exportMap: MapValueType<InternalData["entryPointMap"]>
): Promise<Factory> {
	//
	// optimization: check which embeds can be trimmed/ommited
	// from the project context in order to save space
	//
	const requestedEmbeds = await getRequestedEmbeds(session, apiContext, exportMap)

	const plugin: Factory["plugin"] = {
		name: "enkore-target-js-project-plugin"
	}

	return {
		when: "pre",
		plugin
	}
}
