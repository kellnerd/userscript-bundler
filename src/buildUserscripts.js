import path from 'path';
import { rollup } from 'rollup';
import rollupImage from '@rollup/plugin-image';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import rollupStrip from '@rollup/plugin-strip';
import rollupSucrase from '@rollup/plugin-sucrase';

import { getScriptFiles } from './getFiles.js';
import { userscriptExtensions } from './userscriptMetadata.js';
import userscript from '../plugin.js';

/**
 * Build a userscript for each JavaScript/TypeScript module inside the given source directory.
 * @param {string} sourcePath Source directory containing the executable modules.
 * @param {import('./types/BuildOptions.js').UserscriptBuildOptions} options
 * @returns {Promise<string[]>} Array of userscript file names (with extension).
 */
export async function buildUserscripts(sourcePath, options) {
	const scriptFiles = await getScriptFiles(sourcePath, userscriptExtensions);
	scriptFiles
		.map((file) => path.join(sourcePath, file))
		.forEach((modulePath) => buildUserscript(modulePath, options));

	return scriptFiles;
}


/**
 * Bundles the given module into a userscript.
 * @param {string} modulePath Path containing the executable module of the userscript.
 * @param {import('./types/BuildOptions.js').UserscriptBuildOptions} options
 */
export async function buildUserscript(modulePath, {
	gitRepo,
	debug = false,
}) {
	/**
	 * Bundle all used modules with rollup and prepend the generated metadata block.
	 * @type {import('rollup').RollupOptions}
	 */
	const rollupOptions = {
		input: modulePath,
		treeshake: {
			moduleSideEffects: false,
		},
		output: {
			dir: gitRepo.distributionPath,
			format: 'iife',
		},
		plugins: [
			nodeResolve(),
			rollupSucrase({
				transforms: ['typescript'],
				disableESTransforms: true,
			}),
			rollupImage(),
			rollupStrip({
				functions: debug ? [] : ['console.debug'],
			}),
			userscript({ gitRepo }),
		],
	};

	const bundle = await rollup(rollupOptions);

	if (debug) {
		console.debug(`${modulePath} depends on:`, bundle.watchFiles);
	}

	await bundle.write(rollupOptions.output);
	await bundle.close();
}
