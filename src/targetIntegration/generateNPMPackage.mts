import type {EnkoreSessionAPI} from "@enkore/spec"
import type {APIContext} from "./APIContext.d.mts"
import {getInternalData} from "./getInternalData.mts"
import {getExternals} from "./getExternals.mts"
import type {JsBundlerOptions} from "@enkore-types/target-js-toolchain"
import {getOnRollupLogFunction} from "./getOnRollupLogFunction.mts"
import {generateEntryPointCode} from "./generateEntryPointCode.mts"
import {writeAtomicFile, writeAtomicFileJSON} from "@aniojs/node-fs"
import {getProductPackageJSON} from "./getProductPackageJSON.mts"
import {rollupPluginFactory} from "./rollupPluginFactory.mts"
import {mergeAndHoistGlobalRuntimeDataRecords} from "./mergeAndHoistGlobalRuntimeDataRecords.mts"

async function createDistFiles(
	apiContext: APIContext,
	session: EnkoreSessionAPI
) {
	const toolchain = session.target._getToolchain("@enkore/target-js-toolchain")

	const {entryPointMap} = getInternalData(session)

	for (const [entryPointPath, exportsMap] of entryPointMap.entries()) {
		const externalPackages: string[] = getExternals(apiContext, entryPointPath, session, "packages")
		const externalTypePackages: string[] = getExternals(apiContext, entryPointPath, session, "typePackages")
		const onRollupLogFunction = getOnRollupLogFunction(session)

		const jsBundlerOptions: JsBundlerOptions = {
			treeshake: true,
			externals: externalPackages,
			onRollupLogFunction,
			additionalPlugins: [
				await rollupPluginFactory(session, apiContext, entryPointPath, exportsMap)
			]
		}

		const jsEntryCode = generateEntryPointCode(exportsMap, false)
		const declarationsEntryCode = generateEntryPointCode(exportsMap, true)

		const jsBundle = mergeAndHoist(await toolchain.jsBundler(
			session.project.root, jsEntryCode, {
				...jsBundlerOptions,
				minify: false
			}
		))

		// don't do this, minify jsBundle code
		const minifiedJsBundle = mergeAndHoist(await toolchain.jsBundler(
			session.project.root, jsEntryCode, {
				...jsBundlerOptions,
				minify: true
			}
		))

		const declarationBundle = await toolchain.tsDeclarationBundler(
			session.project.root, declarationsEntryCode, {
				externals: externalTypePackages,
				onRollupLogFunction
			}
		)

		await writeAtomicFile(
			`./dist/${entryPointPath}/index.mjs`, jsBundle, {createParents: true}
		)

		await writeAtomicFile(
			`./dist/${entryPointPath}/index.min.mjs`, minifiedJsBundle, {createParents: true}
		)

		await writeAtomicFile(
			`./dist/${entryPointPath}/index.d.mts`, declarationBundle, {createParents: true}
		)

		function mergeAndHoist(code: string): string {
			return mergeAndHoistGlobalRuntimeDataRecords(session, entryPointPath, code)
		}
	}
}

export async function generateNPMPackage(
	apiContext: APIContext,
	session: EnkoreSessionAPI,
	directory: string,
	packageName: string
) {
	const {entryPointMap} = getInternalData(session)

	await createDistFiles(apiContext, session)

	await writeAtomicFileJSON(
		`./package.json`, getProductPackageJSON(
			apiContext,
			session,
			packageName,
			directory,
			entryPointMap,
			false
		), {pretty: true}
	)
}
