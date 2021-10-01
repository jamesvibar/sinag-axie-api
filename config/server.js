module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "af90f1a1bacfeabdabb88a2b6258daf6"),
    },
  },
  cron: {
    enabled: true,
  },
});
