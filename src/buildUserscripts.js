import path from 'path';
import { rollup } from 'rollup';
import rollupIgnore from 'rollup-plugin-ignore';
import rollupImage from '@rollup/plugin-image';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import rollupStrip from '@rollup/plugin-strip';

import { getScriptFiles } from './getFiles.js';
import { generateMetadataBlock } from './userscriptMetadata.js';

/**
 * Build a userscript for each JavaScript module inside the given source directory.
 * @param {string} sourcePath Source directory containing the executable modules.
 * @param {import('./types/BuildOptions.js').UserscriptBuildOptions} options
 * @returns {Promise<string[]>} Array of userscript file names (without extension).
 */
export async function buildUserscripts(sourcePath, options) {
	const scriptFiles = await getScriptFiles(sourcePath, '.user.js');
	scriptFiles
		.map((file) => path.join(sourcePath, file))
		.forEach((modulePath) => buildUserscript(modulePath, options));

	return scriptFiles.map((file) => path.basename(file, '.user.js'));
}


/**
 * Bundles the given module into a userscript.
 * @param {string} modulePath Path containing the executable module of the userscript.
 * @param {import('./types/BuildOptions.js').UserscriptBuildOptions} options
 */
export async function buildUserscript(modulePath, {
	outputPath,
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
			dir: outputPath,
			format: 'iife',
			banner: generateMetadataBlock(modulePath, { gitRepo }),
		},
		plugins: [
			nodeResolve({
				browser: true,
			}),
			rollupIgnore(['cross-fetch/dist/node-polyfill.js']),
			rollupImage(),
			rollupStrip({
				functions: debug ? [] : ['console.debug'],
			}),
		],
	};

	const bundle = await rollup(rollupOptions);

	if (debug) {
		console.debug(`${modulePath} depends on:`, bundle.watchFiles);
	}

	await bundle.write(rollupOptions.output);
	await bundle.close();
}
