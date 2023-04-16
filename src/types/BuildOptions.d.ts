import type { UserscriptMetadata } from './UserscriptMetadata';

export type UserscriptNameFormatter = ({ baseName, metadata }: { baseName: string, metadata: UserscriptMetadata }) => string;
