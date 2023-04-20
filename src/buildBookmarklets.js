import path from 'path';
import { rollup } from 'rollup';
import rollupIgnore from 'rollup-plugin-ignore';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { minify } from 'terser';
import { zipObject } from '@kellnerd/es-utils/object/zipObject.js';

import { getScriptFiles } from './getFiles.js';

/**
 * Builds a bookmarklet for each JavaScript module inside the given source directory.
 * @param {string} sourcePath Source directory containing the executable modules.
 * @param {import('./types/BuildOptions.js').BookmarkletBuildOptions} options
 * @returns {Promise<{[name: string]: string}>} Object which maps script names to bookmarklets.
 */
export async function buildBookmarklets(sourcePath, options) {
	const scriptFiles = await getScriptFiles(sourcePath);
	const bookmarklets = await Promise.all(scriptFiles
		.map((file) => path.join(sourcePath, file))
		.map((modulePath) => buildBookmarklet(modulePath, options))
	);

	return zipObject(scriptFiles, bookmarklets);
}


/**
 * Bundles and minifies the given module into a bookmarklet.
 * @param {string} modulePath Path to the executable module of the bookmarklet.
 * @param {import('./types/BuildOptions.js').BookmarkletBuildOptions} options
 * @returns {Promise<string>} Bookmarklet code as a `javascript:` URI.
 */
export async function buildBookmarklet(modulePath, {
	outputPath,
	debug = false,
}) {
	/**
	 * Bundle all used modules into an IIFE with rollup.
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
			strict: false,
		},
		plugins: [
			nodeResolve(),
			rollupIgnore(['cross-fetch/dist/node-polyfill.js']),
		],
	};

	const bundle = await rollup(rollupOptions);

	if (debug) {
		console.debug(`${modulePath} depends on:`, bundle.watchFiles);
		bundle.write(rollupOptions.output);
	}

	const { output } = await bundle.generate(rollupOptions.output);
	bundle.close();

	// minify bundled code with terser (see https://terser.org/docs/api-reference)
	const minifiedBundle = await minify({
		modulePath: output[0].code,
	}, {
		ecma: 2020,
		compress: {
			expression: true,
			drop_console: !debug,
			passes: 3,
			unsafe: true,
			unsafe_arrows: true,
		},
		format: {
			ascii_only: true,
			wrap_func_args: false,
		},
	});

	if (debug) console.log(`${minifiedBundle.code.length} bytes for bookmarklet '${modulePath}'`);

	return `javascript:${minifiedBundle.code}`;
}
