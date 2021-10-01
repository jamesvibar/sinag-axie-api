'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async todaySLP(ctx) {


    const slpData = strapi.services.apprentices.getSLP('0x1624e8765e8f044c7c3920bff20e6ed8d2e3559c')
    // create a service for fetching SLP

    return ctx.send('Hello world')
  }
};
