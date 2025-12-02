require('dotenv').config();

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
