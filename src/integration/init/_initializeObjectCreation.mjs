import {_getTypeScriptDefinitions} from "./_getTypeScriptDefinitions.mjs"
import fs from "node:fs/promises"

/*
  parents: [],
  name: 'scandirCallback.mts',
  relative_path: 'scandirCallback.mts',
  source: 'auto/synthetic/async.sync/src/scandirCallback.mts'
*/

async function convertTypeScriptFile(fourtune_session, code, file_path) {
	const {tsStripTypesFromCode} = fourtune_session.getDependency(
		"@fourtune/base-realm-js-and-web"
	)

	return await tsStripTypesFromCode(code, {
		filename: file_path,
		replace_import_extensions: true
	})
}

export async function _initializeObjectCreation(fourtune_session) {
	const {getBuildPathFromProjectRoot, getBuildPath} = fourtune_session.paths

	const tscInputFiles = []

	for (const file of fourtune_session.input.getFilteredSourceFiles()) {
		const extensionlessSource = file.source.slice(0, -4)
		const absolutePath = getBuildPathFromProjectRoot(file.source)

		tscInputFiles.push(getBuildPathFromProjectRoot(file.source))

		fourtune_session.objects.addObject(
			`${extensionlessSource}.mjs`, async () => {
				const code = (await fs.readFile(
					absolutePath
				)).toString()

				return await convertTypeScriptFile(
					fourtune_session, code, file.source
				)
			}
		)

		/**
		 * Running each source file through the typescript compiler
		 * separately is extremely slow.
		 *
		 * Instead, run every source file through tsc and cache the result.
		 */
		fourtune_session.objects.addObject(
			`${extensionlessSource}.d.mts`, async (fourtune_session) => {
				const key = getBuildPath(`${extensionlessSource}.d.mts`)

				if (!fourtune_session.user_data.tsc_definitions.has(key)) {
					fourtune_session.emit.error(
						undefined, `cannot find declarations for ${file.source}.`
					)

					return `/* error: cannot find declarations */\n`
				}

				return fourtune_session.user_data.tsc_definitions.get(key)
			}
		)
	}

	fourtune_session.hooks.register(
		"createObjectFiles.pre", async () => {
			fourtune_session.user_data.tsc_definitions = await _getTypeScriptDefinitions(
				fourtune_session,
				tscInputFiles
			)
		}
	)
}
