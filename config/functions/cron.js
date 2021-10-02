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
  "*/5 * * * *": async () => {

    /**
     * @todo:
     * Only fetch apprentices where `slp.last_updated_at` is atleast 2 - 3 hours old.
     * In the official axie discord they said that axie's APIs updates their cache if it's only atleast 3 hours old.
     * So to greatly reduce server cron load, lets filter out apprentices whose data is not stale.
     */

    // Get updated slp data of apprentices/scholars from axie api
    const { data } = await strapi.config.functions.slp();

    if (data) {
      const bulkWriteQuery = data.map((slpData) => ({
        updateOne: {
          filter: { ronin_id: slpData.client_id },
          update: { slp: slpData },
        },
      }));

      const response = await strapi
        .query("apprentices")
        .model.bulkWrite(bulkWriteQuery);
      if (response && response?.result.ok) {
        console.log(`Successfully synced up SLP Data (${Date.now()})`);
      } else {
        throw new Error(
          "An error has occured while trying to sync apprentices' slp"
        );
      }
    }
  },
};
