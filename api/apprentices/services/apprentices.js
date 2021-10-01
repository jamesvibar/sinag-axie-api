"use strict";
const axios = require("axios");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async find(params, populate = []) {
    const documents = await strapi
      .query("apprentices")
      .find(params, ["-daily_slps", "today_slp", "yesterday_slp", ...populate]);

    // const roninIds = documents.map(({ _id, roninId }) => ({ _id, roninId }));

    // this.getTodaySLPs(roninIds);

    // console.log(roninIds);

    return documents;
  },

  /**
   *
   * @param {Array} roninIds
   */
  async getTodaySLPs(roninIds = []) {
    try {
      if (!roninIds.length) {
        throw new Error("Ronin ID Array is required");
      }

      const utcStart = new Date();
      utcStart.setHours(0, 0, 0, 0);
      const utcEnd = new Date();
      utcEnd.setHours(23, 59, 59, 999);

      const csRoninIds = roninIds.map((obj) => obj.roninId).join(",");

      const response = await axios.get(
        `https://game-api.axie.technology/slp/${csRoninIds}`
      );

      const result = await Promise.all(
        roninIds.map(async (document) => {
          const todaySLPLog = await strapi.query("slp-logs").model.find({
            apprentice: document._id,
            createdAt: {
              $gte: utcStart,
              $lt: utcEnd,
            },
          });

          const { beginningSLP, endSLP } = todaySLPLog;

          if (response.status !== 200) {
            console.error(response?.data || response);
            return {
              apprentice: document._id,
              roninId: document.roninId,
              todaySLP: 0,
            };
          }

          const slpData = response.data;

          // const ingameSLP = slpData

          // let todaySLP = !beginningSLP || beginningSLP === 0 ? 1000

          return todaySLPLog
            ? {
                apprentice: document._id,
                roninId: document.roninId,
                todaySLP: 100,
              }
            : {
                apprentice: document._id,
                roninId: document.roninId,
                todaySLP: 0,
              };
        })
      );

      console.log(result);

      return "hello";

      // Get SLP from game-api.skymavis.com
      // const response = await axios.get(
      //   `https://game-api.skymavis.com/game-api/clients/${roninIds}/items/1`
      // );

      // if (response.status === 200) {
      //   return response.data;
      // } else {
      //   throw new Error("Response status is not 200, please try again.");
      // }
    } catch (err) {
      if (err) {
        throw new Error(err.message);
      }
    }
  },
  async getYesterdaySLPs() {
    try {
      // find slpLogs of ronin Id, with createdAt of yesterday.

      return 0;
    } catch (err) {
      if (err) {
        throw new Error(err.message);
      }
    }
  },
};
