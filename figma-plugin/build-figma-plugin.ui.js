const path = require('path');

// NODE_ENVに基づいて環境別ファイルを読み込む
const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, `.env.${env}`);

// 環境別ファイルを読み込み（.envフォールバックは削除）
require('dotenv').config({ path: envFile });

module.exports = function (buildOptions) {
  return {
    ...buildOptions,
    define: {
      ...buildOptions.define,
      'process.env.API_BASE_URL': JSON.stringify(
        process.env.API_BASE_URL || 'http://localhost:3000/api'
      ),
    },
  };
};
