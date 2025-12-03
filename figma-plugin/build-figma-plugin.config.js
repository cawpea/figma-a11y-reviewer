const path = require('path');

// NODE_ENVに基づいて環境別ファイルを読み込む
const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, `.env.${env}`);

// 環境別ファイルを読み込み
require('dotenv').config({ path: envFile });

/**
 * 共通のビルド設定を返す関数
 * @param {Object} buildOptions - @create-figma-plugin/buildから渡されるビルドオプション
 * @returns {Object} カスタマイズされたビルドオプション
 */
function createBuildConfig(buildOptions) {
  return {
    ...buildOptions,
    define: {
      ...buildOptions.define,
      'process.env.API_BASE_URL': JSON.stringify(
        process.env.API_BASE_URL || 'http://localhost:3000/api'
      ),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  };
}

module.exports = createBuildConfig;
