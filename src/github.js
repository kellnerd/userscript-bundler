import { readFileSync } from 'fs';
import {
	slugify,
} from '@kellnerd/es-utils/string/casingStyle.js';

// Inspired by https://github.com/ROpdebee/mb-userscripts/blob/841fa757a21d53a2ce714c7868ffb98116c15ffb/build/plugin-userscript.ts
export class GitRepo {
	defaultBranch = 'main';
	distributionPath = 'dist';

	/** @param {URL} repoUrl */
	constructor(repoUrl, userscriptNameFormatter) {
		const [owner, repoName] = repoUrl.pathname.match(/^\/([^/]+)\/([^/]+?)(?:\.git|$)/)?.slice(1) ?? [];
		if (!owner || !repoName) throw new Error(`Malformed git repo URL ${repoUrl}`);

		this.host = repoUrl.host
		this.owner = owner;
		this.repoName = repoName;
		this.userscriptNameFormatter = userscriptNameFormatter;
	}

	get repoUrl() {
		return `https://${this.host}/${this.owner}/${this.repoName}`;
	}

	get supportUrl() {
		return `${this.repoUrl}/issues`;
	}

	/**
	 * Instantiates a `GitRepo` object using data parsed from the provided `package.json` file.
	 * @param {Object} args
	 * @param {string} args.packageJsonPath
	 * @param {import('./types/BuildOptions').UserscriptNameFormatter} args.userscriptNameFormatter
	 */
	static fromPackageMetadata({ packageJsonPath = 'package.json', userscriptNameFormatter }) {
		/** @type {typeof import('../package.json')} */
		const metadata = JSON.parse(readFileSync(packageJsonPath));
		const repoUrl = new URL(metadata.repository.url);
		return new GitRepo(repoUrl, userscriptNameFormatter);
	}

	/**
	 * Generates a link to the section in the README for the given script.
	 * @param {Object} args
	 * @param {string} args.baseName Basename of the script to be linked.
	 * @param {import('./types/UserscriptMetadata').UserscriptMetadata} args.metadata Metadata of the script to be linked.
	 */
	readmeSectionUrl({ baseName, metadata }) {
		return `${this.repoUrl}#${slugify(this.userscriptNameFormatter({ baseName, metadata }))}`;
	}

	/**
	 * Generates the path for the given userscript.
	 * @param {string} baseName
	 */
	userscriptPath(baseName) {
		return `${this.distributionPath}/${baseName}.user.js`;
	}

	/**
	 * Generates the raw URL for the given userscript.
	 * @param {string} baseName
	 */
	userscriptRawUrl(baseName) {
		return 'https://raw.' + [this.host, this.owner, this.repoName, this.defaultBranch, this.userscriptPath(baseName)].join('/');
	}

	/**
	 * Generates button-like links to install a userscript and to view its source code on GitHub.
	 * @param {string} baseName Name of the userscript file (without extension).
	 */
	sourceAndInstallButton(baseName) {
		const sourceButtonLink = 'https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github';
		const installButtonLink = 'https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey';
		return `\n[![Install](${installButtonLink})](${this.userscriptPath(baseName)}?raw=1)\n` +
			`[![Source](${sourceButtonLink})](${this.userscriptPath(baseName)})\n`;
	}
}
