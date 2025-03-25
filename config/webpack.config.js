module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error("webpack-dev-server is not defined");
      }

      console.log("🚀 Custom Middleware Loaded");

      // Example API route
      devServer.app.get("/api/status", (req, res) => {
        res.json({ status: "OK" });
      });

      return middlewares;
    },
    hot: true, // Enable Hot Module Replacement (HMR)
    compress: true, // Enable Gzip compression for faster load
    historyApiFallback: true, // Fixes issues when using React Router
    client: {
      overlay: false, // Disables error overlays
    },
    static: {
      directory: __dirname + "/public", // Serve static files from public folder
      watch: false, // Disable watching static files
    },
    devMiddleware: {
      writeToDisk: false, // Improves rebuild performance
    },
    open: true, // Automatically opens the browser on start
  }
};

