import {
	type EnkoreAutogeneratedFile,
	createEntity
} from "@enkore/spec"
import type {AutogenerateAPIContext} from "#~src/autogenerate/AutogenerateAPIContext.mts"
import type {Options} from "./Options.mts"
import {destinationPathToFunctionName} from "./destinationPathToFunctionName.mts"
import path from "node:path"

export function _generateInstantiationFile(
	apiContext: AutogenerateAPIContext,
	options: Options
): EnkoreAutogeneratedFile {
	const exportName = destinationPathToFunctionName(
		options.destination
	).slice(0, -("Factory".length))

	const destinationPath = path.join(
		path.dirname(options.destination),
		`${exportName}.mts`
	)

	return createEntity("EnkoreAutogeneratedFile", 0, 0, {
		destinationPath,
		generator() {
			// we assume/know that the factory file is right beside
			// the instantiation file
			return `
import {getProject} from "@enkore-target/${apiContext.target}/project"
import {createContext} from "@enkore/js-runtime/v0"
import {${exportName}Factory as factory} from "./${exportName}Factory.mts"

export const ${exportName} = factory(createContext(getProject(), undefined))
`.slice(1)
		}
	})
}
