import type {API} from "#~src/targetIntegration/API.d.mts"
import type {APIContext} from "#~src/targetIntegration/APIContext.d.mts"
import type {NodeAPIMessage} from "@anio-software/enkore-private.spec/primitives"
import {getInternalData} from "#~src/targetIntegration/getInternalData.mts"

const impl: API["lint"] = async function(
	this: APIContext, session, file
) {
	// don't lint build files
	if (file.entityKind === "EnkoreBuildFile") return [];
	// ignore filtered files
	if (file.wasFiltered) return [];
	// ignore .css files
	if (file.fileName.endsWith(".css")) return [];

	const toolchain = session.target._getToolchain("js")
	const myNewProgram = getInternalData(session).myTSProgram

	const mod = myNewProgram.getModule(`build/${file.relativePath}`)

	if (!mod) {
		// not an error if we are doing a partial build
		if (session.enkore.getOptions()._partialBuild === true) {
			return []
		}

		return [{
			severity: "error",
			id: undefined,
			message: `failed to find module for file 'build/${file.relativePath}'`
		}]
	}

	let messages: NodeAPIMessage[] = []

	for (const moduleSpecifier of toolchain.tsGetModuleImportAndExportSpecifiers(mod)) {
		if (moduleSpecifier.endsWith(".mjs")) {
			messages.push({
				severity: "error",
				message: "moduleSpecifier ends with '.mjs'",
				id: "impreciseModuleSpecifier"
			})
		} else if (moduleSpecifier.endsWith(".d.mts")) {
			messages.push({
				severity: "error",
				message: "moduleSpecifier ends with '.d.mts'",
				id: "impreciseModuleSpecifier"
			})
		}
	}

	for (const msg of toolchain.tsTypeCheckModule(mod)) {
		session.enkore.emitMessage(
			"error", msg.message
		)
	}

	return messages
}

export function lintFactory(context: APIContext) {
	return impl!.bind(context)
}
