import type {
	MyTSProgram,
	MyTSModule
} from "@enkore-types/target-js-toolchain"

export function getModuleGuarded(prog: MyTSProgram, filePath: string): MyTSModule {
	const mod = prog.getModule(filePath)

	if (!mod) {
		throw new Error(`Unable to get module for path '${filePath}'.`)
	}

	return mod
}
