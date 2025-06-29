import {
	readEnkoreConfigFile,
	getProjectRootFromArgumentAndValidate,
	resolveImportSpecifierFromProjectRoot
} from "@anio-software/enkore-private.spec/utils"
import type {NodePackageJSON} from "@anio-software/enkore-private.spec/primitives"
import {readFileJSON} from "@aniojs/node-fs"
import path from "node:path"
import {importAPI, createEntity} from "@anio-software/enkore-private.spec"
import {createNodeAPIOptions} from "@anio-software/enkore-private.spec/factory"
import {_generateEmbedFileMap} from "./_generateEmbedFileMap.mts"
import crypto from "node:crypto"
import type {ProjectAPIContext} from "./ProjectAPIContext.d.mts"

function sha256Sync(str: string): string {
	const hash = crypto.createHash("sha256")

	return hash.update(str).digest("hex").toLowerCase()
}

export async function generateProjectAPIContext(
	userProjectRoot: string | ["inferFromCLIArgs"],
	invokeEnkore: boolean
): Promise<ProjectAPIContext> {
	const projectRoot = await getProjectRootFromArgumentAndValidate(
		userProjectRoot
	)

	const projectConfig = await readEnkoreConfigFile(projectRoot)
	const projectPackageJSON = (await readFileJSON(
		path.join(projectRoot, "package.json")
	)) as NodePackageJSON

	//
	// if this API was called from node at runtime we need to make sure
	// objects/embeds is up-to-date. We achieve this by running a partial build
	//
	if (invokeEnkore) {
		const enkorePath = resolveImportSpecifierFromProjectRoot(
			projectRoot, "enkore"
		)

		if (!enkorePath) {
			throw new Error(`Unable to resolve "enkore" from the project root.`)
		}

		const {enkore} = await importAPI(enkorePath, "EnkoreNodeAPI", 0)

		const {project} = await enkore(projectRoot, createNodeAPIOptions({
			force: false,
			isCIEnvironment: false,
			npmBinaryPath: undefined,
			onlyInitializeProject: false,
			stdIOLogs: false,
			_forceBuild: false,
			_partialBuild: true,
		}))

		const {messages} = await project.build()

		console.log(messages)
	}

	// we know objects/embeds is up-to-date at this point here
	const _projectEmbedFileMapRemoveMeInBundle = await _generateEmbedFileMap(projectRoot)
	const projectId = sha256Sync(
		`${projectPackageJSON.name}@${projectPackageJSON.version}`
	)

	// provide translation between local and global embed URLs
	// this is mainly to not have the user (end application) do SHA256..
	const projectEmbedFileTranslationMap: Record<string, string> = {}

	for (const [embedPath] of _projectEmbedFileMapRemoveMeInBundle.entries()) {
		projectEmbedFileTranslationMap[embedPath] = sha256Sync(
			`${projectId}/${embedPath}`
		)
	}

	return {
		project: createEntity("EnkoreJSRuntimeProject", 0, 0, {
			projectId: projectId,
			enkoreConfiguration: JSON.parse(JSON.stringify(projectConfig)),
			packageJSON: JSON.parse(JSON.stringify(projectPackageJSON))
		}),
		projectId,
		projectConfig,
		projectPackageJSON,
		projectEmbedFileTranslationMap,
		_projectEmbedFileMapRemoveMeInBundle
	}
}
