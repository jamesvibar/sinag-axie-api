module.exports = ({ env }) => ({
  email: {
    provider: "nodemailer",
    providerOptions: {
      host: env("SMTP_HOST", "smtp.ethereal.email"),
      port: env("SMTP_PORT", 587),
      auth: {
        user: env("SMTP_USERNAME", "maria.heidenreich@ethereal.email"),
        pass: env("SMTP_PASSWORD", "qFyZXUkTXyfDvyJuE7"),
      },
      // ... any custom nodemailer options
    },
    // settings: {
    //   defaultFrom: "hello@example.com",
    //   defaultReplyTo: "hello@example.com",
    // },
  },
});
