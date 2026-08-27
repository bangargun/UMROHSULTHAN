module.exports = {
  apps: [
    {
      name: "sulthan-umroh-erp",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "file:./dev.db"
      }
    }
  ]
};
