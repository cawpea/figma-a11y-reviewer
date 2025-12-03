/// <reference types="@figma/plugin-typings" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_BASE_URL: string;
    readonly NODE_ENV: 'development' | 'production';
  }
}

// Figmaプラグインコンテキストでprocess.envが利用可能であることを宣言
declare const process: {
  env: {
    API_BASE_URL: string;
    NODE_ENV: 'development' | 'production';
  };
};
