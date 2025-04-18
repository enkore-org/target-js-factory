import type {MyTSProgram, MyTSExport} from "@enkore-types/typescript"
import type {RequestedEmbedsFromCodeResult} from "@enkore-types/babel"

export type Export = {
	name: string
	descriptor: MyTSExport
	relativePath: string
	pathToJsFile: string
	pathToDtsFile: string
}

export type InternalData = {
	myTSProgram: MyTSProgram
	entryPointMap: Map<string, Map<string, Export>>

	// cache calls to getRequestedEmbedsFromCode()
	requestedEmbedsFileCache: Map<string, RequestedEmbedsFromCodeResult>
}
