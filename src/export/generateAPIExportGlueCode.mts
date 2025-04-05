import type {ObjectPropertyTree} from "#~src/util/ObjectPropertyTree.d.mts"
import {methodNamesToTree} from "#~src/util/methodNamesToTree.mts"

function printTree(
	apiVariable: string,
	rootNode: ObjectPropertyTree,
	depth: number = 0,
	rootPath: string = "",
	currentKey: string = ""
) {
	const indent0 = "\t".repeat(depth)
	const indent = "\t".repeat(depth + 1)
	let code = ``

	code += `${indent0}`

	if (currentKey.length) {
		code += `"${currentKey}":`
	}

	code += `{\n`

	for (const [key, value] of rootNode.entries()) {
		const currentPath = !rootPath.length ? key : `${rootPath}.${key}`

		if (value === "method") {
			code += `${indent}"${key}": `

			let tmp = `${apiVariable}`

			for (const part of currentPath.split(".")) {
				tmp += `["${part}"]`
			}

			code += `${tmp},\n`
		} else {
			code += printTree(apiVariable, value, depth + 1, currentPath, key)
		}
	}

	return code + `${indent0}}\n`
}

export function generateAPIExportGlueCode(
	apiType: string,
	apiVariable: string,
	methodNames: string[]
): string {
	const apiMethodTree = methodNamesToTree(methodNames)

	let code = ``

	code += `export const apiID = ${apiVariable}.apiID\n`
	code += `export const apiMajorVersion =  ${apiVariable}.apiMajorVersion\n`
	code += `export const apiRevision = ${apiVariable}.apiRevision\n`

	for (const [key, value] of apiMethodTree) {
		code += `export const ${key}: ${apiType}["${key}"] = `

		if (value === "method") {
			code += `${apiVariable}["${key}"];\n`
		} else {
			code += printTree(apiVariable, value, 0, key)
		}
	}

	return code
}
