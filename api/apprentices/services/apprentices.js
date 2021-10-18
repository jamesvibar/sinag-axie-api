"use strict";
const ObjectId = require("mongoose").Types.ObjectId;

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
  async findOne(params, populate = []) {
    const id = params?.id;

    if (!ObjectId.isValid(id)) {
      throw strapi.errors.notFound("Not found");
    }

    const document = await strapi
      .query("apprentices")
      .model.findOne({ _id: id })
      .populate([
        {
          path: "account",
          select: "-daily_slps",
          populate: [{ path: "today_slp" }, { path: "yesterday_slp" }],
        },
        ...populate.map((p) => ({ path: p })),
      ]);

    return document;
  },
};
