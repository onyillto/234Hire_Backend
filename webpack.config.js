// webpack.config.js
module.exports = {
  devServer: {
    // 0.0.0.0 allows the server to be accessible externally (e.g. from host machine)
    host: '0.0.0.0', 
    port: 3000,
    client: {
      // Explicitly tell the browser to look at localhost, not 0.0.0.0
      webSocketURL: {
        hostname: 'localhost',
        pathname: '/ws',
        port: 3000,
      },
    },
  },
};
