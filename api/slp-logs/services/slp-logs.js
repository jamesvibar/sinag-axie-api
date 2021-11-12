"use strict";
const ObjectId = require("mongoose").Types.ObjectId;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async find(params, populate) {
    const account = params?.account;

    const limit = params?.limit ? parseInt(params.limit) : 100;

    if (account) {
      const logs = await strapi.query("slp-logs").model.aggregate([
        {
          $match: {
            account: ObjectId(account),
            end_slp: { $gt: 0 },
          },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "apprentices",
            let: { account: "$account" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$account", "$$account"],
                  },
                },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  manager_share: "$manager_share",
                  apprentice_share: "$apprentice_share",
                },
              },
            ],
            as: "apprentice",
          },
        },
        {
          $unwind: {
            path: "$apprentice",
          },
        },
        {
          $project: {
            today_slp: { $subtract: ["$end_slp", "$beginning_slp"] },
            manager_share: "$apprentice.manager_share",
            apprentice_share: "$apprentice.apprentice_share",
            createdAt: "$createdAt",
          },
        },
        {
          $project: {
            today_slp: "$today_slp",
            manager_slp: {
              $round: [{ $multiply: ["$today_slp", "$manager_share"] }, 1],
            },
            apprentice_slp: {
              $round: [{ $multiply: ["$today_slp", "$apprentice_share"] }, 1],
            },
            createdAt: "$createdAt",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            today_slp: {
              $sum: "$today_slp",
            },
            manager_slp: {
              $sum: "$manager_slp",
            },
            apprentice_slp: {
              $sum: "$apprentice_slp",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      return logs;
    } else {
      return strapi.query("slp-logs").find(params, populate);
    }
  },
};
