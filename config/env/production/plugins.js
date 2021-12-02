module.exports = ({ env }) => ({
  email: {
    provider: "nodemailer",
    providerOptions: {
      host: env("SMTP_HOST", "smtp.ethereal.email"),
      port: env("SMTP_PORT", 587),
      auth: {
        user: env("SMTP_USERNAME", "ejudk46qwf3b5ckz@ethereal.email"),
        pass: env("SMTP_PASSWORD", "9QSzKGQJ2TnEsbddQt"),
      },
      // ... any custom nodemailer options
    },
    // settings: {
    //   defaultFrom: "hello@example.com",
    //   defaultReplyTo: "hello@example.com",
    // },
  },
});
