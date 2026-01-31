/// <reference types="vite/client" />

declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';
declare module '*.styl';

declare module '*/package.json' {
  interface PackageJson {
    version: string;
    [key: string]: unknown;
  }
  const value: PackageJson;
  export default value;
}

declare module '../package.json' {
  interface PackageJson {
    version: string;
    [key: string]: unknown;
  }
  const value: PackageJson;
  export default value;
}
