import type {API} from "#~src/API.d.mts"
import type {APIContext} from "#~src/APIContext.d.mts"
import {createEntity} from "@enkore/spec"
import {scandir} from "@aniojs/node-fs"
import path from "node:path"
import {
	isAsyncSyncExpandableFilePath,
	expandAsyncSyncVariantFilePath,
	expandAsyncSyncVariantSourceFile
} from "@enkore/realm-js-and-web-utils"

const impl: API["hook"]["preInitialize"] = async function(
	this: APIContext, session
) {
	const allProjectFiles = [
		...await scan("src"),
		...await scan("export")
	]

	for (const file of allProjectFiles) {
		const isAsyncSyncVariantTemplateFile = isAsyncSyncExpandableFilePath(
			file.source
		)

		if (!isAsyncSyncVariantTemplateFile) continue

		const [asyncPath, syncPath] = expandAsyncSyncVariantFilePath(
			file.source
		)

		session.addAutogeneratedFile(
			createEntity(
				"EnkoreAutogeneratedFile", 0, 0, {
					destinationPath: asyncPath,
					generator() {
						return expandAsyncSyncVariantSourceFile(
							file.absolutePath, "async"
						)
					}
				}
			)
		)

		session.addAutogeneratedFile(
			createEntity(
				"EnkoreAutogeneratedFile", 0, 0, {
					destinationPath: syncPath,
					generator() {
						return expandAsyncSyncVariantSourceFile(
							file.absolutePath, "sync"
						)
					}
				}
			)
		)
	}

	async function scan(dir: string) {
		return (
			await scandir(path.join(
				session.project.root, "project", dir
			), {
				allow_missing_dir: true
			})
		).map(entry => {
			return {
				absolutePath: entry.absolute_path,
				source: path.join("project", dir, entry.relative_path)
			}
		})
	}
}

export function preInitializeFactory(context: APIContext) {
	return impl!.bind(context)
}
