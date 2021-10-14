"use strict";
const ObjectId = require("mongoose").Types.ObjectId;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async beforeCreate(data) {
      if (!data?.account) {
        throw strapi.errors.badRequest(
          "Cannot create apprentice, account (ronin_id) is required!"
        );
      }

      // check if account is an ObjectId,
      if (ObjectId.isValid(data.account)) {
        return;
      }

      console.log("peform other stuff...");
      const roninId = data.account;

      // find if we have existing account for this ronin id
      const account = await strapi
        .query("accounts")
        .findOne({ ronin_id: roninId });

      if (account) {
        data.account = account._id;
        return;
      }

      const createdAccount = await strapi.query("accounts").create({
        ronin_id: roninId,
      });

      data.account = createdAccount._id;
      return;
    },
  },
};
