"use strict";
const axios = require("axios");
const mongoose = require("mongoose");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const AXIE_GAME_API = "https://game-api.axie.technology";

module.exports = {
  lifecycles: {
    async beforeCreate(data) {
      try {
        // fetch initial slp and pvp data from axie servers
        const roninId = data.ronin_id;

        const [responseMMR, responseSLP] = await Promise.all([
          axios.get(`${AXIE_GAME_API}/mmr/${roninId}`),
          axios.get(`${AXIE_GAME_API}/slp/${roninId}`),
        ]);

        if (
          responseMMR.status !== 200 ||
          responseMMR?.data[0].success !== true ||
          responseSLP.status !== 200 ||
          responseSLP?.data[0].success !== true
        )
          throw strapi.errors.badRequest(
            "Failed to create apprentice data: Couldn't fetch initial data from axie servers. Please try again"
          );

        const mmrData = responseMMR.data[0].items[1];
        const slpData = responseSLP.data[0];
        data["slp"] = slpData;
        data["pvp"] = mmrData;
        data["axie_updated_at"] = responseSLP.data[0].update_time;
      } catch (err) {
        if (err) {
          console.error(err);
          throw new Error(err.message);
        }
      }
    },
  },
};
