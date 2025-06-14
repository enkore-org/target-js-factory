import type {InternalData} from "./InternalData.d.mts"

type EntryPointMap = InternalData["entryPointMap"]
// thanks to josephjnk https://www.reddit.com/r/typescript/comments/hf5g3a/comment/fvvn0ez/
type MapValueType<A> = A extends Map<any, infer V> ? V : never;
type EntryPoint = MapValueType<EntryPointMap>

export function generateEntryPointCode(
	entryPoint: EntryPoint,
	kind: "js" | "dts" | "css"
): string {
	let code = ``

	if (kind === "js") {
		for (const [exportName, meta] of entryPoint.entries()) {
			if (meta.descriptor.kind === "type") continue

			code += `export {${exportName}} from "./${meta.pathToJsFile}"\n`
		}
	} else if (kind === "dts") {
		for (const [exportName, meta] of entryPoint.entries()) {
			if (meta.descriptor.kind === "type") {
				code += `export type {${exportName}} from "./${meta.pathToDtsFile}"\n`
			} else {
				code += `export {${exportName}} from "./${meta.pathToJsFile}"\n`
			}
		}
	} else if (kind === "css") {
		for (const [exportName, meta] of entryPoint.entries()) {
			for (const [cssFilePath] of meta.cssImportMap.entries()) {
				if (cssFilePath.startsWith("/")) {
					code += `@import ${JSON.stringify(cssFilePath)};\n`
				} else {
					code += `@import ${JSON.stringify(`./build/${cssFilePath}`)};\n`
				}
			}
		}
	}

	return code
}
