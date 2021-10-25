const queue = require("fastq").promise(worker, 1);

async function worker(accountId) {
  // Get yesterday's daily slp.
  const yesterday = new Date(); // date is in ISO
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = new Date(yesterday);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const yesterdayLog = await strapi.query("slp-logs").model.findOne({
    account: accountId,
    createdAt: {
      $gte: yesterdayStart,
      $lt: yesterdayEnd,
    },
  });

  const account = await strapi.query("accounts").model.findOne({
    _id: accountId,
  });

  if (!account) {
    return "Cannot find account with id: " + accountId;
  }

  let currentInGameSLP =
    account.slp.total - account.slp.blockchain_related.balance;
  if (yesterdayLog) {
    await strapi.query("slp-logs").update(
      {
        _id: yesterdayLog._id,
      },
      {
        end_slp: currentInGameSLP,
      }
    );
  }

  // create daily slp log for the day
  console.log(account)
  const createdLog = await strapi.query("slp-logs").create({
    beginning_slp: currentInGameSLP,
    account: account._id,
  });

  // update our apprentice's data
  await strapi.query("accounts").model.update(
    {
      _id: account._id,
    },
    {
      today_slp: createdLog._id,
      yesterday_slp: yesterdayLog ? yesterdayLog._id : null,
    }
  );

  return "Run daily slp logs worker for " + accountId;
}

async function run() {
  const accounts = await strapi.query("accounts").find();
  for (const account of accounts) {
    const result = await queue.push(account._id);
    console.log(result);
  }
}

module.exports = {
  run,
};
