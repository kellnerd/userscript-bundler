import path from 'path';
import { pathToFileURL } from 'url';
import { preferArray } from '@kellnerd/es-utils/array/scalar.js';

/** @type {Array<keyof import('./types/UserscriptMetadata.js').UserscriptMetadata>} */
const metadataOrder = [
	'name',
	'version',
	'namespace',
	'author',
	'description',
	'icon',
	'homepageURL',
	'downloadURL',
	'updateURL',
	'supportURL',
	'require',
	'resource',
	'grant',
	'connect',
	'run-at',
	'sandbox',
	'inject-into',
	'noframes',
	'unwrap',
	'match',
	'include',
	'exclude-match',
	'exclude',
];

/**
 * Generates the metadata block for the given userscript from the corresponding .meta.js ES module.
 * @param {string} userscriptPath
 * @param {import('./types/BuildOptions.js').UserscriptMetadataOptions} options
 */
export async function generateMetadataBlock(userscriptPath, { gitRepo }) {
	const baseName = path.basename(userscriptPath, '.user.js');
	const date = new Date(); // current date will be used as version identifier
	const maxKeyLength = Math.max(...metadataOrder.map((key) => key.length));

	/** @type {import('./types/UserscriptMetadata.js').UserscriptDefaultMetadata} */
	const defaultMetadata = {
		author: gitRepo.owner,
		namespace: gitRepo.repoUrl,
		homepageURL: '',
		downloadURL: gitRepo.userscriptRawUrl(baseName),
		updateURL: gitRepo.userscriptRawUrl(baseName),
		supportURL: gitRepo.supportUrl,
	};

	/** @type {import('./types/UserscriptMetadata.js').UserscriptMetadata} */
	const metadata = {
		...defaultMetadata,
		version: [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('.'),
		grant: 'none',
		...await loadMetadata(userscriptPath),
	};

	metadata.homepageURL = gitRepo.readmeSectionUrl({ baseName, metadata });

	const metadataBlock = metadataOrder.flatMap((key) => {
		return preferArray(metadata[key])
			.filter((value) => value)
			.map((value) => `// @${key.padEnd(maxKeyLength)} ${value === true ? '' : value}`);
	});

	metadataBlock.unshift('// ==UserScript==');
	metadataBlock.push('// ==/UserScript==\n');

	return metadataBlock.join('\n');
}

/**
 * Loads the metadata for the given userscript from the .meta.js ES module of the same name.
 * @param {string} userscriptPath
 * @returns {Promise<import('./types/UserscriptMetadata.js').EnhancedUserscriptMetadata>}
 */
export async function loadMetadata(userscriptPath) {
	const metadataPath = userscriptPath.replace(/\.user\.js$/, '.meta.js');
	const metadataModule = await import(pathToFileURL(metadataPath));

	return metadataModule.default;
}

/**
 * Creates a regular expression that matches a full HTTP or HTTPS URL.
 * @param {string} domainAndPathRegex Regular expression that matches domain and path.
 */
export function createURLRuleRegex(domainAndPathRegex, {
	allowQuery = true,
	allowFragment = true,
} = {}) {
	let ruleRegex = '/^https?://' + domainAndPathRegex;

	if (allowQuery) {
		ruleRegex += String.raw`(\?.+?)?`;
	}
	if (allowFragment) {
		ruleRegex += '(#.+?)?';
	}

	return ruleRegex + '$/';
}

/**
 * Creates a regular expression that matches a MusicBrainz URL.
 * @param {string} pathRegex Regular expression that matches a path on musicbrainz.org.
 */
export function createMusicBrainzURLRule(pathRegex) {
	return createURLRuleRegex(String.raw`((beta|test)\.)?musicbrainz\.org/` + pathRegex);
}
