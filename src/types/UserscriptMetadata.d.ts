import type { MaybeArray } from '@kellnerd/es-utils';

/**
 * Metadata headers of a specific userscript.
 * Unless noted otherwise, these are supported by Greasemonkey (GM), Tampermonkey (TM) and Violentmonkey (VM).
 */
export type UserscriptSpecificMetadata = {
	/** Name of the script, must be unique within `@namespace`. */
	name: string;
	/** Version of the script which is used by the auto-update feature. */
	version?: string;
	/** A brief summary of what the script does. */
	description: string;
	/** Icon which is displayed for the script in the userscript manager. */
	icon?: string | URL;
	/** URL to another script which should be downloaded and executed. */
	require?: MaybeArray<string | URL>;
	/** Name and URL of a static resource, separated by whitespace. */
	resource?: MaybeArray<string>;
	/** Specify which special APIs can be used when the script executes, see https://wiki.greasespot.net/@grant */
	grant?: MaybeArray<string>;
	/** Decide when the script will execute. */
	'run-at'?: 'document-end' | 'document-start' | 'document-idle';
	/** Decide which context the script will be injected into. Supported by VM. */
	'inject-into'?: 'page' | 'content' | 'auto';
	/** Rules to decide whether a script should be executed, see https://developer.chrome.com/extensions/match_patterns */
	match?: MaybeArray<string>;
	/** See {@linkcode UserscriptSpecificMetadata.match}. Supported by VM. */
	'exclude-match'?: MaybeArray<string>;
	/** https://wiki.greasespot.net/Include_and_exclude_rules */
	include?: MaybeArray<string | RegExp>;
	/** https://wiki.greasespot.net/Include_and_exclude_rules */
	exclude?: MaybeArray<string | RegExp>;
};

/** Common default metadata headers of a userscript. */
export type UserscriptDefaultMetadata = {
	/** Author of the script. */
	author: string;
	/** Combination of `@namespace` and `@name` is the unique identifier for a userscript. */
	namespace: string | URL;
	/** Homepage for the script, falls back to namespace if it is an URL. Supported by TM, VM. */
	homepageURL: string | URL;
	/** Supported by TM, VM. */
	downloadURL: string | URL;
	/** Supported by TM. */
	updateURL: string | URL;
	/** URL where the user can report issues and get support. Supported by TM, VM. */
	supportURL: string | URL;
};

/** Metadata headers of a userscript. */
export type UserscriptMetadata = UserscriptSpecificMetadata & Partial<UserscriptDefaultMetadata>;

/** Metadata headers of a userscript, enhanced with additional metadata for the userscript bundler. */
export type EnhancedUserscriptMetadata = UserscriptMetadata & {
	/** List of features which will be shown in the README, items may contain inline Markdown. */
	features?: string[];
};
