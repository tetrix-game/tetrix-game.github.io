/**
 * Application version information
 * Automatically synced with package.json during build
 */

// This is a config file that pulls in data from package.json, it is not subject to the same architectural rules, which are intended for React component hierarchies only.
// eslint-disable-next-line architecture/enforce-downwards-imports, architecture/folder-export-must-match
import packageJson from '../package.json';

export const APP_VERSION = packageJson.version;
