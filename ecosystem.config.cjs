module.exports = {
  apps: [
    {
      name: "asambleapp",
      script: "dist/server.cjs",
      instances: 1,
      exec_mode: "cluster",
      env: {
        APP_PORT: 4006,
        NODE_ENV: "production"
      }
    }
  ]
};
