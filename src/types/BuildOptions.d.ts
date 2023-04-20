import type { UserscriptMetadata } from './UserscriptMetadata';
import type { GitRepo } from '../github';

export type UserscriptNameFormatterData = {
	/** Name of the userscript file (without extension). */
	baseName: string;
	/** Metadata of the userscript. */
	metadata: UserscriptMetadata;
};

export type UserscriptNameFormatter = (data: UserscriptNameFormatterData) => string;

export type GitRepoOptions = {
	userscriptNameFormatter: UserscriptNameFormatter;
};

export type GitRepoFromPackageOptions = GitRepoOptions & {
	/** Path to the `package.json` file of the repository. */
	packageJsonPath?: string;
};

export type UserscriptBuildOptions = {
	gitRepo: GitRepo;
	debug?: boolean;
};

export type UserscriptMetadataOptions = {
	gitRepo: GitRepo;
};

export type BookmarkletBuildOptions = {
	debug?: boolean;
};
