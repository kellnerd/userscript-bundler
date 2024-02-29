import fs from 'fs';
import path from 'path';
import { camelToTitleCase } from '@kellnerd/es-utils/string/casingStyle.js';

import { buildBookmarklets } from './buildBookmarklets.js';
import { buildUserscripts } from './buildUserscripts.js';
import { extractDocumentation } from './extractDocumentation.js';
import { getMarkdownFiles } from './getFiles.js'
import { GitRepo, getCurrentBranch } from './github.js';
import { loadMetadata } from './userscriptMetadata.js';

/**
 * Returns the formatted name of the userscript for use in documentation.
 * @type {import('./types/BuildOptions.js').UserscriptNameFormatter}
 */
function defaultNameFormatter({ metadata }) {
	return metadata.name;
}

/**
 * Builds userscripts, prepares bookmarklets and generates a nicely formatted documentation page.
 * @param {Object} options
 * @param {string?} options.bookmarkletSourcePath Directory containing bookmarklet source files.
 * @param {string} options.userscriptSourcePath Directory containing userscript source files.
 * @param {import('./types/BuildOptions.js').UserscriptNameFormatter} options.userscriptNameFormatter
 * Function used to format userscript names in documentation.
 * @param {string} options.docSourcePath Directory containing markdown documentation files.
 * @param {string} options.outputPath Directory where the built userscripts should be stored.
 * @param {string} options.readmePath Path to write generated README file in markdown format.
 * @param {boolean} options.debug Flag to enable debug output.
 */
export async function build({
	bookmarkletSourcePath = null,
	userscriptSourcePath = 'src/userscripts/',
	userscriptNameFormatter = defaultNameFormatter,
	docSourcePath = 'doc/',
	outputPath = 'dist/',
	readmePath = 'README.md',
	debug = false,
} = {}) {
	const gitRepo = GitRepo.fromPackageMetadata({
		defaultBranch: await getCurrentBranch(),
		distributionPath: outputPath,
		userscriptNameFormatter,
	});

	// build userscripts
	const userscriptNames = await buildUserscripts(userscriptSourcePath, {
		outputPath,
		gitRepo,
		debug,
	});

	// prepare bookmarklets (optional)
	const bookmarklets = bookmarkletSourcePath ? await buildBookmarklets(bookmarkletSourcePath, {
		outputPath: path.join(outputPath, 'bookmarklets'),
		debug,
	}) : {};

	// prepare README file and write header
	const readme = fs.createWriteStream(readmePath);
	const readmeHeader = fs.readFileSync(path.join(docSourcePath, '_header.md'), { encoding: 'utf-8' });
	readme.write(readmeHeader);

	// obtain all documentation files, keep track of unprocessed files
	const docFiles = await getMarkdownFiles(docSourcePath);
	const remainingDocFiles = new Set(docFiles);

	// write userscripts and their extracted documentation to the README
	readme.write('\n## Userscripts\n');

	for (let baseName of userscriptNames) {
		const filePath = path.join(userscriptSourcePath, baseName + '.user.js');
		const metadata = await loadMetadata(filePath);

		readme.write(`\n### ${userscriptNameFormatter({ baseName, metadata })}\n`);
		readme.write('\n' + metadata.description + '\n');
		metadata.features?.forEach((item) => readme.write(`- ${item}\n`));
		readme.write(gitRepo.sourceAndInstallButton(baseName));

		// append documentation if there is a documentation file with the same base name
		const docFile = docFiles.find((filename) => filename.startsWith(baseName));
		if (docFile) {
			appendDocFileToReadme(docFile);
			remainingDocFiles.delete(docFile);
		}

		// also insert the code snippet if there is a bookmarklet of the same name
		const bookmarkletFileName = baseName + '.js';
		if (bookmarkletFileName in bookmarklets) {
			const bookmarkletPath = path.join(bookmarkletSourcePath, bookmarkletFileName);

			readme.write('\nAlso available as a bookmarklet with less features:\n');
			readme.write(extractDocumentation(bookmarkletPath) + '\n');
			readme.write('\n```js\n' + bookmarklets[bookmarkletFileName] + '\n```\n');

			delete bookmarklets[bookmarkletFileName];
		}
	}

	// write remaining bookmarklets and their extracted documentation to the README
	if (Object.keys(bookmarklets).length) {
		readme.write('\n## Bookmarklets\n');

		for (let fileName in bookmarklets) {
			const baseName = path.basename(fileName, '.js');
			const bookmarkletPath = path.join(bookmarkletSourcePath, fileName);

			readme.write(`\n### [${camelToTitleCase(baseName)}](${relevantSourceFile(fileName, bookmarkletSourcePath)})\n`);

			readme.write(extractDocumentation(bookmarkletPath) + '\n');
			readme.write('\n```js\n' + bookmarklets[fileName] + '\n```\n');
		}
	}

	// append all remaining documentation files to the README
	remainingDocFiles.forEach(appendDocFileToReadme);
	readme.close();

	/**
	 * Appends a documentation file from the documentation directory to the README.
	 * @param {string} filename Name of the (Markdown) documentation file.
	 */
	function appendDocFileToReadme(filename) {
		const filePath = path.join(docSourcePath, filename);
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
		readme.write('\n' + content);
	}
}


/**
 * Returns the path to the relevant source code file for the given script.
 * This is the module of the same name inside the source directory if it exists, otherwise it is the file itself.
 * @param {string} fileName File name of the script.
 * @param {string} basePath Base path of the script file which is used as fallback.
 */
function relevantSourceFile(fileName, basePath) {
	const srcPath = path.posix.join('src', fileName);
	return fs.existsSync(srcPath) ? srcPath : path.posix.join(basePath, fileName);
}
