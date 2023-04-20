import path from 'path';
import { rollup } from 'rollup';
import rollupIgnore from 'rollup-plugin-ignore';
import rollupImage from '@rollup/plugin-image';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import rollupStrip from '@rollup/plugin-strip';

import { getScriptFiles } from './getFiles.js';
import { GitRepo } from './github.js';
import { generateMetadataBlock } from './userscriptMetadata.js';

/**
 * Build a userscript for each JavaScript module inside the given source directory.
 * @param {Object} args
 * @param {string} args.sourcePath Source directory containing the modules.
 * @param {GitRepo} args.gitRepo
 * @returns {Promise<string[]>} Array of userscript file names (without extension).
 */
export async function buildUserscripts({ sourcePath, gitRepo, debug = false }) {
	const scriptFiles = await getScriptFiles(sourcePath, '.user.js');
	scriptFiles
		.map((file) => path.join(sourcePath, file))
		.forEach((modulePath) => buildUserscript({ sourcePath: modulePath, gitRepo, debug }));

	return scriptFiles.map((file) => path.basename(file, '.user.js'));
}


/**
 * Bundles the given module into a userscript.
 * @param {Object} args
 * @param {string} args.sourcePath Path containing the executable module of the userscript.
 * @param {GitRepo} args.gitRepo
 */
export async function buildUserscript({ sourcePath, gitRepo, debug = false }) {
	/**
	 * Bundle all used modules with rollup and prepend the generated metadata block.
	 * @type {import('rollup').RollupOptions}
	 */
	const rollupOptions = {
		input: sourcePath,
		treeshake: {
			moduleSideEffects: false,
		},
		output: {
			dir: 'dist',
			format: 'iife',
			banner: generateMetadataBlock(sourcePath, gitRepo),
		},
		plugins: [
			nodeResolve(),
			rollupIgnore(['cross-fetch/dist/node-polyfill.js']),
			rollupImage(),
			rollupStrip({
				functions: ['console.debug'],
			}),
		],
	};

	const bundle = await rollup(rollupOptions);

	if (debug) {
		console.debug(`${sourcePath} depends on:`, bundle.watchFiles);
	}

	await bundle.write(rollupOptions.output);
	await bundle.close();
}
