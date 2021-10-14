"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async find(params, populate = []) {
    const documents = await strapi
      .query("apprentices")
      .model.find(params)
      .populate([
        {
          path: "account",
          select: "-daily_slps",
          populate: [{ path: "today_slp" }, { path: "yesterday_slp" }],
        },
        ...populate.map((p) => ({ path: p })),
      ]);

    return documents;
  },
};
