const axios = require("axios");

module.exports = async () => {
  const apprentices = await strapi.query("apprentices").find();
  const roninIds = apprentices
    .map((apprentice) => apprentice.ronin_id)
    .join(",");

  const response = await axios.get(
    `https://game-api.axie.technology/slp/${roninIds}`
  );

  if (response.status !== 200) {
    throw new Error("An error occured while trying to sync up axie slp data.");
  }

  return response;
};
