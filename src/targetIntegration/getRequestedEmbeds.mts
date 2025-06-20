import type {EnkoreSessionAPI} from "@anio-software/enkore-private.spec"
import type {APIContext} from "./APIContext.mts"
import type {EntryPoint} from "./InternalData.d.mts"
import type {RequestedEmbedsFromCodeReasonWhyUnknown} from "@anio-software/enkore-private.target-js-toolchain_types"
import {getInternalData} from "./getInternalData.mts"
import {getModuleGuarded} from "./getModuleGuarded.mts"
import {getProjectAPIMethodNames} from "#~synthetic/user/export/project/getProjectAPIMethodNames.mts"
import {readFileString} from "@aniojs/node-fs"
import {baseModuleSpecifier} from "#~src/baseModuleSpecifier.mts"
import path from "node:path"

type RequestedEmbeds = {
	result: "all"
	reasonsWhy: RequestedEmbedsFromCodeReasonWhyUnknown[]
} | {
	result: "specific"
	usedEmbeds: Map<string, {
		requestedByMethods: string[]
	}>
}

export async function getRequestedEmbeds(
	session: EnkoreSessionAPI,
	apiContext: APIContext,
	entryPoint: EntryPoint
): Promise<RequestedEmbeds> {
	const reasonsWhy: RequestedEmbedsFromCodeReasonWhyUnknown[] = []
	const usedEmbeds: Map<string, {requestedByMethods: string[]}> = new Map()

	const enkoreProjectModuleSpecifiers = [
		`${baseModuleSpecifier}/project`
	]

	const enkoreProjectModuleGetEmbedProperties = getProjectAPIMethodNames().filter(x => {
		return x.toLowerCase().includes("embed")
	})

	const toolchain = session.target._getToolchain("js")
	const filesToAnalyze: Map<string, true> = new Map()

	for (const [_, {relativePath}] of entryPoint.exports.entries()) {
		const mod = getModuleGuarded(
			getInternalData(session).myTSProgram,
			`build/${relativePath}`
		)

		for (const file of mod.moduleFileDependencyTree.convertToArray()) {
			if (file.startsWith("external:")) continue

			filesToAnalyze.set(file, true)
		}

		filesToAnalyze.set(mod.filePath, true)
	}

	for (const [filePath] of filesToAnalyze.entries()) {
		const jsObjectFiles = session.enkore.getCreatedObjectFilesForRelativeSourcePath(
			filePath.slice("build/".length)
		).filter(path => {
			return path.endsWith(".mjs") || path.endsWith(".js")
		})

		if (jsObjectFiles.length !== 1) {
			// todo: emit warning / error
			continue
		}

		const jsCode = await readFileString(
			path.join(
				session.project.root, "objects", jsObjectFiles[0]
			)
		)

		const requestedEmbedsResult = await toolchain.getRequestedEmbedsFromCode(
			enkoreProjectModuleSpecifiers,
			enkoreProjectModuleGetEmbedProperties,
			jsCode
		)

		if (requestedEmbedsResult.codeRequestsEmbeds === false) {
			continue
		}

		if (requestedEmbedsResult.requestedEmbeds === "unknown") {
			const {reasonWhyUnknown} = requestedEmbedsResult

			if (!reasonsWhy.includes(reasonWhyUnknown)) {
				reasonsWhy.push(reasonWhyUnknown)
			}

			continue
		}

		for (const {embedPath, requestedByMethod} of requestedEmbedsResult.requestedEmbeds) {
			if (!usedEmbeds.has(embedPath)) {
				usedEmbeds.set(embedPath, {
					requestedByMethods: []
				})
			}

			const {requestedByMethods} = usedEmbeds.get(embedPath)!

			if (!requestedByMethods.includes(requestedByMethod)) {
				requestedByMethods.push(requestedByMethod)
			}
		}
	}

	if (reasonsWhy.length) {
		return {
			result: "all",
			reasonsWhy
		}
	}

	return {
		result: "specific",
		usedEmbeds
	}
}
