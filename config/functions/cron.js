"use strict";

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#cron-tasks
 */

module.exports = {
  /**
   * Update slp data every 5 minutes. (slp data is only updated every 3 hrs on axie apis)
   */
  "*/1 * * * *": {
    task: async () => {
      // Get updated slp data of apprentices/scholars from axie api
      const responses = await strapi.config.functions.slp();

      if (!responses) {
        console.log("There are no outdated accounts to sync yet.");
        return;
      }

      if (responses) {
        const { slp, mmr } = responses;

        // Sync account data
        let bulkWriteQuery = slp.map((slpData) => ({
          updateOne: {
            filter: { ronin_id: slpData.client_id },
            update: { slp: slpData, axie_updated_at: slpData.update_time },
          },
        }));

        bulkWriteQuery = bulkWriteQuery.map((writeQuery) => {
          const client_id = writeQuery.updateOne.filter.ronin_id;

          const mmrData = mmr.find(
            (mmrData) => mmrData.items[1].client_id === client_id
          );
          if (mmrData) {
            writeQuery["updateOne"]["update"]["pvp"] = mmrData.items[1];
          }

          return writeQuery;
        });

        const response = await strapi
          .query("accounts")
          .model.bulkWrite(bulkWriteQuery);
        if (response && response?.result.ok) {
          console.log(`Successfully synced up SLP Data on (${Date.now()})`);
        } else {
          throw new Error(
            "An error has occured while trying to sync account's slp"
          );
        }
      }
    },
    options: {
      tz: "UTC",
    },
  },
  /**
   * Axie daily reset 12:00 UTC
   */
  // "*/1 * * *": {
  "0 0 * * *": {
    task: async () => {
      strapi.config.functions.worker.run();
    },
    options: {
      tz: "UTC",
    },
  },
};
