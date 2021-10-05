const axios = require("axios");

const AXIE_GAME_API = "https://game-api.axie.technology";

module.exports = async () => {
  // Get current date
  const currentTime = Date.now();
  const threeHours = 1000 * 60 * 60 * 3;
  const updateTime = currentTime - threeHours;

  const apprentices = await strapi.query("apprentices").find({
    axie_updated_at_lte: updateTime,
  });

  if (apprentices.length > 0) {
    const roninIds = apprentices
      .map((apprentice) => apprentice.ronin_id)
      .join(",");

    const [slpResponse, mmrResponse] = await Promise.all([
      axios.get(`${AXIE_GAME_API}/slp/${roninIds}`),
      axios.get(`${AXIE_GAME_API}/mmr/${roninIds}`),
    ]);

    if (mmrResponse.status !== 200 || slpResponse.status !== 200) {
      throw new Error(
        "An error occured while trying to sync up axie slp data."
      );
    }

    return {
      mmr: mmrResponse.data,
      slp: slpResponse.data,
    };
  }

  return false;
};
