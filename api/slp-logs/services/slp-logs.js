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
          $sort: {
            _id: -1,
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

      console.log(logs);
      console.log(logs.length);
      return logs
      // return [
      //   {
      //     _id: "2021-10-26",
      //     today_slp: 80,
      //     manager_slp: 48,
      //     apprentice_slp: 32,
      //   },
      //   {
      //     _id: "2021-10-27",
      //     today_slp: 22,
      //     manager_slp: 13.2,
      //     apprentice_slp: 8.8,
      //   },
      //   { _id: "2021-10-28", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      //   { _id: "2021-10-29", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      //   {
      //     _id: "2021-10-31",
      //     today_slp: 86,
      //     manager_slp: 51.6,
      //     apprentice_slp: 34.4,
      //   },
      //   {
      //     _id: "2021-11-01",
      //     today_slp: 78,
      //     manager_slp: 46.8,
      //     apprentice_slp: 31.2,
      //   },
      //   {
      //     _id: "2021-11-04",
      //     today_slp: 79,
      //     manager_slp: 47.4,
      //     apprentice_slp: 31.6,
      //   },
      //   {
      //     _id: "2021-11-05",
      //     today_slp: 79,
      //     manager_slp: 47.4,
      //     apprentice_slp: 31.6,
      //   },
      //   { _id: "2021-11-06", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      //   { _id: "2021-11-07", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      //   {
      //     _id: "2021-11-08",
      //     today_slp: 75,
      //     manager_slp: 45,
      //     apprentice_slp: 30,
      //   },
      //   {
      //     _id: "2021-11-09",
      //     today_slp: 106,
      //     manager_slp: 63.6,
      //     apprentice_slp: 42.4,
      //   },
      //   { _id: "2021-11-10", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      //   { _id: "2021-11-11", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      //   {
      //     _id: "2021-11-12",
      //     today_slp: 135,
      //     manager_slp: 81,
      //     apprentice_slp: 54,
      //   },
      //   {
      //     _id: "2021-11-13",
      //     today_slp: 12,
      //     manager_slp: 7.2,
      //     apprentice_slp: 4.8,
      //   },
      //   {
      //     _id: "2021-11-14",
      //     today_slp: 111,
      //     manager_slp: 66.6,
      //     apprentice_slp: 44.4,
      //   },
      //   {
      //     _id: "2021-11-15",
      //     today_slp: 93,
      //     manager_slp: 55.8,
      //     apprentice_slp: 37.2,
      //   },
      //   {
      //     _id: "2021-11-16",
      //     today_slp: 108,
      //     manager_slp: 64.8,
      //     apprentice_slp: 43.2,
      //   },
      //   {
      //     _id: "2021-11-17",
      //     today_slp: 237,
      //     manager_slp: 142.2,
      //     apprentice_slp: 94.8,
      //   },
      //   { _id: "2021-11-18", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      //   {
      //     _id: "2021-11-21",
      //     today_slp: 180,
      //     manager_slp: 108,
      //     apprentice_slp: 72,
      //   },
      //   {
      //     _id: "2021-11-22",
      //     today_slp: 185,
      //     manager_slp: 111,
      //     apprentice_slp: 74,
      //   },
      //   {
      //     _id: "2021-11-23",
      //     today_slp: 129,
      //     manager_slp: 77.4,
      //     apprentice_slp: 51.6,
      //   },
      //   {
      //     _id: "2021-11-24",
      //     today_slp: 171,
      //     manager_slp: 102.6,
      //     apprentice_slp: 68.4,
      //   },
      //   {
      //     _id: "2021-11-25",
      //     today_slp: 49,
      //     manager_slp: 29.4,
      //     apprentice_slp: 19.6,
      //   },
      //   {
      //     _id: "2021-11-26",
      //     today_slp: 153,
      //     manager_slp: 91.8,
      //     apprentice_slp: 61.2,
      //   },
      //   {
      //     _id: "2021-11-27",
      //     today_slp: 108,
      //     manager_slp: 64.8,
      //     apprentice_slp: 43.2,
      //   },
      //   {
      //     _id: "2021-11-28",
      //     today_slp: 129,
      //     manager_slp: 77.4,
      //     apprentice_slp: 51.6,
      //   },
      //   { _id: "2021-11-30", today_slp: 0, manager_slp: 0, apprentice_slp: 0 },
      // ];
      // return logs;
    } else {
      return strapi.query("slp-logs").find(params, populate);
    }
  },
};
