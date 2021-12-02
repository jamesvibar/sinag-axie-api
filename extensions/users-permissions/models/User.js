module.exports = {
  lifecycles: {
    async beforeCreate(data) {
      // set confirmed to false since we are requiring users to confirm their email for
      // some features to be enabled
      data.confirmed = false;
      return;
    },
    async afterCreate(result, data) {
      strapi.plugins["users-permissions"].services.user.sendConfirmationEmail(
        result
      );
    },
    async beforeUpdate(params, data) {
      if ("email" in data) {
        const user = await strapi
          .query("user", "users-permissions")
          .findOne(params);
        const currentEmail = user.email;

        if (data["email"] !== currentEmail) {
          console.log("changed email!");
          strapi.plugins[
            "users-permissions"
          ].services.user.sendConfirmationEmail({
            ...user,
            email: data["email"],
          });
          data.confirmed = false;
          data.endOfDayReports = false;
        }
      }
    },
  },
};
