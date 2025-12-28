module.exports = {
  apps: [
    {
      name: "http-backend",
      script: "npm",
      args: "run start",
      cwd: "/home/ubuntu/Sketch/apps/http-backend",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        PORT: 3001,
      },
    },
  ],
};
