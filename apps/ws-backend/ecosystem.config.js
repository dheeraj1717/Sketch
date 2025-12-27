module.exports = {
  apps: [
    {
      name: "ws-backend",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
