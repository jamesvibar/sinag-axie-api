module.exports = {
  lifecycles: {
    async beforeCreate(data) {
      // set confirmed to false since we are requiring users to confirm their email for
      // some features to be enabled
      data.confirmed = false;
      return;
    },
    async beforeUpdate(params, data) {
      if ("email" in data) {
        data.confirmed = false;
      }
    },
  },
};
