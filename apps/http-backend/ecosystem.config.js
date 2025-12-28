module.exports = {
  apps: [
    {
      name: "http-backend",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
