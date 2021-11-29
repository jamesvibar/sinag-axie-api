"use strict";
const ObjectId = require("mongoose").Types.ObjectId;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findSlpLogsOfManager(ctx) {
    const { id: managerId } = ctx.params;
    const limit = ctx.query?.limit ? parseInt(ctx.query.limit) : 100;

    if (!managerId) {
      throw strapi.errors.badRequest("Manager ID is required");
    }

    // check if account is an ObjectId,
    if (!ObjectId.isValid(managerId)) {
      throw strapi.errors.badRequest("Manager ID must be a valid object ID");
    }

    // fetch manager's apprentices so we can fetch the slp logs of them.
    const apprentices = await strapi.query("apprentices").model.find({
      manager: managerId,
    });

    if (!apprentices) {
      return ctx.send([]);
    }

    // make sure that we have no account duplicates.
    let accountIds = new Set([
      ...apprentices.map((apprentice) => ObjectId(apprentice.account)),
    ]);
    accountIds = Array.from(accountIds);

    const ratios = apprentices.map((apprentice) => ({
      id: apprentice._id,
      manager_ratio: apprentice.manager_share,
      apprentice_ratio: apprentice.apprentice_share,
    }));

    const logs = await strapi.query("slp-logs").model.aggregate([
      {
        $match: {
          account: { $in: accountIds },
        },
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
          today_slp: {
            $cond: {
              if: { $lt: ["$end_slp", "$beginning_slp"] },
              then: 0,
              else: {
                $subtract: ["$end_slp", "$beginning_slp"],
              },
            },
          },
          manager_share: "$apprentice.manager_share",
          apprentice_share: "$apprentice.apprentice_share",
          createdAt: "$createdAt",
        },
      },
      {
        $project: {
          today_slp: "$today_slp",
          manager_slp: {
            $multiply: ["$today_slp", "$manager_share"],
          },
          apprentice_slp: {
            $multiply: ["$today_slp", "$apprentice_share"],
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
            $sum: {
              $round: ["$manager_slp", 1],
            },
          },
          apprentice_slp: {
            $sum: {
              $round: ["$apprentice_slp", 1],
            },
          },
        },
      },
      {
        $limit: limit,
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return ctx.send(logs);
  },
  async runDailySLP(ctx) {
    console.log(ctx.state);

    return ctx.send("Hello world");
  },
};
