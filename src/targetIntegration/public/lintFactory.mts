import type {API} from "#~src/targetIntegration/API.d.mts"
import type {APIContext} from "#~src/targetIntegration/APIContext.d.mts"
import {getTargetDependency} from "#~src/targetIntegration/getTargetDependency.mts"
import type {NodeAPIMessage} from "@enkore/spec/primitives"
import {getInternalData} from "#~src/targetIntegration/getInternalData.mts"

const impl: API["lint"] = async function(
	this: APIContext, session, file
) {
	// can do better?:
	// myNewProgram.getModule check
	if (file.wasFiltered) return [];

	let messages: NodeAPIMessage[] = []

	const nodeMyTS = getTargetDependency(session, "@enkore/typescript")
	const myNewProgram = getInternalData(session).myTSProgram

	const mod = myNewProgram.getModule(`build/${file.relativePath}`)

	for (const moduleSpecifier of nodeMyTS.getModuleImportAndExportSpecifiers(mod)) {
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

	for (const msg of nodeMyTS.typeCheckModule(mod)) {
		session.enkore.emitMessage(
			"error", msg.message
		)
	}

	return messages
}

export function lintFactory(context: APIContext) {
	return impl!.bind(context)
}
