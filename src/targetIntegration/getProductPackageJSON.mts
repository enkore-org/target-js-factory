import type {EnkoreSessionAPI} from "@anio-software/enkore-private.spec"
import type {APIContext} from "./APIContext.d.mts"
import type {NodePackageJSON} from "@anio-software/enkore-private.spec/primitives"
import type {InternalData} from "./InternalData.d.mts"

type EntryPointMap = InternalData["entryPointMap"]

function exactDependencies(
	dependencies: Record<string, string>|undefined
): Record<string, string> {
	if (!dependencies) return {}

	const exactDependencies: Record<string, string> = {}

	for (const dependencyName in dependencies) {
		const dependencyVersion = dependencies[dependencyName]

		exactDependencies[dependencyName] = (() => {
			if (dependencyVersion.startsWith("~") ||
			    dependencyVersion.startsWith("^")) {
				return `=${dependencyVersion.slice(1)}`
			}

			return dependencyVersion
		})()
	}

	return exactDependencies
}

function removeNonTypeDependencies(
	peerDependencies: Record<string, string>|undefined
): Record<string, string> {
	if (!peerDependencies) return {}

	const typeOnlyPeerDependencies: Record<string, string> = {}

	for (const dependencyName in peerDependencies) {
		if (!dependencyName.startsWith("@types/")) {
			continue
		}

		typeOnlyPeerDependencies[dependencyName] = peerDependencies[dependencyName]
	}

	return typeOnlyPeerDependencies
}

export function getProductPackageJSON(
	apiContext: APIContext,
	session: EnkoreSessionAPI,
	packageName: string,
	directory: string,
	entryPointMap: EntryPointMap,
	typeOnly: boolean
): NodePackageJSON {
	const targetOptions = session.target.getOptions("js")

	let newPackageJSON: NodePackageJSON = {
		name: packageName,
		type: "module",
		version: session.project.packageJSON.version,
		author: session.project.packageJSON.author,
		license: session.project.packageJSON.license,
		description: session.project.packageJSON.description,
		peerDependencies: session.project.packageJSON.peerDependencies,
		dependencies: session.project.packageJSON.dependencies,

		files: ["./dist"]
	}

	if (targetOptions.environment.includes("node")) {
		// todo: add @types/node peer dep?

		newPackageJSON["engines"] = {
			"node": ">=23.6.x"
		}
	}

	// todo: check dependencies of type only package
	// by calling session.target._getToolchain("js").getModuleImportAndExportSpecifiers()
	// allow @types/ peerDependencies
	if (typeOnly) {
		newPackageJSON.dependencies = {}
		newPackageJSON.peerDependencies = removeNonTypeDependencies(
			newPackageJSON.peerDependencies
		)
	}

	if (targetOptions.publishWithExactDependencyVersions === true) {
		newPackageJSON.dependencies = exactDependencies(
			newPackageJSON.dependencies
		)
	}

	const {repository} = session.project.packageJSON

	if (repository) {
		newPackageJSON.repository = {
			type: repository.type,
			url: repository.url,
			directory
		}
	}

	newPackageJSON.exports = (() => {
		const ret: Record<string, any> = {
			"./package.json": {
				"default": "./package.json"
			}
			//"./__enkoreBuildInfo": {
			//	"types": "./__enkoreBuildInfo/index.d.mts",
			//	"default": "./__enkoreBuildInfo/index.mjs"
			//}
		}

		for (const [entryPointPath] of entryPointMap.entries()) {
			const exp: Record<string, string> = {
				"types": `./dist/${entryPointPath}/index.d.mts`
			}

			if (!typeOnly) {
				exp["default"] = `./dist/${entryPointPath}/index.mjs`
			}

			if (entryPointPath === "default") {
				ret["."] = exp
			} else {
				ret[`./${entryPointPath}`] = exp
			}
		}

		// we are doing this here to keep the order in the resulting package.json clean
		// todo: only provide .css export if styles were being used
		if (!typeOnly) {
			for (const [entryPointPath] of entryPointMap.entries()) {
				if (entryPointPath === "default") {
					ret["./style.css"] = `./dist/default/style.css`
				} else {
					ret[`./${entryPointPath}/style.css`] = `./dist/${entryPointPath}/style.css`
				}
			}
		}

		return ret
	})()

	return newPackageJSON
}
