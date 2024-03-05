import { generateMetadataBlock } from './src/userscriptMetadata.js';

/**
 * Plugin which injects userscript metadata into the bundle as a banner.
 * 
 * The userscript metadata module has to be imported into the entry module using a type assertion:
 * ```
 * import "./example.meta.js" assert { type: "metadata" };
 * ```
 * 
 * @returns {import('rollup').Plugin}
 */
export default function userscript({ gitRepo }) {
	/** @type {Map<string, string>} */
	const metadataByImporter = new Map();

	return {
		name: "@kellnerd/userscript",

		async resolveId(source, importer, options) {
			// Remember import source with `{ type: "metadata" }` assertion for each importer module.
			if (options.assertions.type === "metadata") {
				metadataByImporter.set(importer, source);
			}
		},

		banner: {
			handler(chunk) {
				const metadataModule = metadataByImporter.get(chunk.facadeModuleId);
				if (metadataModule) {
					// TODO: Once `generateMetadataBlock` depends on `metadataModule`, we can no longer easily obtain metadata to create the README.
					return generateMetadataBlock(chunk.facadeModuleId, { gitRepo });
				}
			}
		},
	}
}
