const axios = require("axios");
const ObjectId = require("mongoose").Types.ObjectId;
const format = require("date-fns/format");

const queue = require("fastq").promise(worker, 1);
const emailQueue = require("fastq").promise(emailWorker, 1);

const websiteUrl = "https://sinag.jamesvibar.dev";

function getSLPDifference(end, start) {
  let difference = end - start;

  return difference < 0 ? 0 : difference;
}

function renderTable(apprentices) {
  // sort apprentices
  let sortedApprentices = apprentices
    .map((apprentice) => ({
      name: apprentice.name,
      slp: getSLPDifference(
        apprentice.account.yesterday_slp.end_slp,
        apprentice.account.yesterday_slp.beginning_slp
      ),
    }))
    .sort((a, b) => b.slp - a.slp);

  return sortedApprentices
    .map(
      (apprentice) => `
        <tr>
          <td style="padding: 4px 0;color:#89625A;">${apprentice.name}</td>
          <td style="padding: 4px 0;color:#89625A;">${apprentice.slp}</td>
        </tr>
      `
    )
    .join("");
}

const mjmlTemplate = (data) => `
  <mjml>
    <mj-head>
      <mj-font name="Roboto" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"/>
    </mj-head>
    <mj-body background-color="#ccd3e0">
      <mj-section background-color="#fff" padding-bottom="20px" padding-top="20px">
        <mj-column width="100%">
          <mj-image src="${websiteUrl}/_next/image?url=%2Fimages%2Fsinag-logo.png&w=256&q=100" alt="" align="center" border="none" width="100px" padding-left="0px" padding-right="0px" padding-bottom="0px" padding-top="0"></mj-image>
        </mj-column>
      </mj-section>
      <mj-section background-color="#FFB103" padding-bottom="0px" padding-top="0">
        <mj-column width="100%">
          <mj-text align="center" font-family="Roboto" font-size="13px" color="#4C0D00" padding-left="25px" padding-right="25px" padding-bottom="18px" padding-top="28px">HELLO MANAGER
            <p style="font-size:16px; font-weight: 600;" font-family="Roboto">${
              data.name
            }</p>
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section background-color="#fff5de" padding-bottom="5px" padding-top="0">
        <mj-column width="100%">
          <mj-text align="center" color="#4C0D00" font-family="Roboto" font-size="13px"padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px"><span style="font-size:20px; font-weight:bold">Here's your apprentices end of day report for ${
            data.date
          }</span>
            <br />
            <span style="font-size:15px; margin-top: 8px; display: inline-block;color:#89625A;">This is only an estimate and we can only provide data what axie can give.</span>
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="0" background-color="#fff5de">
        <mj-column>
          <mj-text color="#4C0D00">Total SLP: <strong>${
            data.totalSLP
          }</strong></mj-text>
        </mj-column>
      </mj-section>
      <mj-section background-color="#fff5de">
        <mj-column>
          <mj-table>
            <tr style="border-bottom:1px solid #e6d2ce;text-align:left;padding:15px 4px;color:#4C0D00;">
              <th style="padding: 4px 0;">Name</th>
              <th style="padding: 4px 0;">SLP</th>
            </tr>
            ${renderTable(data.apprentices)}
          </mj-table>
        </mj-column>
      </mj-section>

      <mj-section background-color="#fff5de" padding-bottom="5px" padding-top="0">
        <mj-column width="100%">
          <mj-text align="center" color="#4C0D00" font-size="15px" font-family="Roboto" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="20px">
            <span style="font-size:15px">SINAG Management</span>
            <p style="font-size: 11px;color:#89625A;">You can stop receiving end-of-day reports by logging in sinag.jamesvibar.dev and disabling it from your My Accounts page. </p>
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`;

async function emailWorker(manager) {
  try {
    const EMAIL_SETTINGS = {
      from: strapi.config.plugins.email.settings.defaultFrom,
      replyTo: strapi.config.plugins.email.settings.defaultReplyTo,
    };

    const apprentices = await strapi
      .query("apprentices")
      .model.find({ manager })
      .populate([
        {
          path: "account",
          select: "-daily_slps",
          populate: [{ path: "yesterday_slp" }],
        },
      ]);

    if (apprentices.length === 0) {
      return `skipped eod report for manager ${manager?.name} reason: no apprentices found`;
    }

    const yesterdaySLPIds = apprentices.map((apprentice) =>
      ObjectId(apprentice.account.yesterday_slp._id)
    );

    const yesterdayDate = new Date(
      apprentices[0].account.yesterday_slp.createdAt
    );

    const yesterdayDateFormatted = format(yesterdayDate, "LLL do");
    const yesterdayDateFormattedFull = format(yesterdayDate, "MM/dd/yyyy");

    const totalSLPLogs = await strapi.query("slp-logs").model.aggregate([
      {
        $match: {
          _id: { $in: yesterdaySLPIds },
        },
      },
      {
        $project: {
          total_slp: {
            $cond: {
              if: { $lt: ["$end_slp", "$beginning_slp"] },
              then: 0,
              else: {
                $subtract: ["$end_slp", "$beginning_slp"],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSLP: {
            $sum: "$total_slp",
          },
        },
      },
    ]);

    const mjmlTemplateStr = mjmlTemplate({
      name: manager.name,
      date: yesterdayDateFormatted,
      totalSLP: totalSLPLogs[0].totalSLP,
      // formattedCurrency,
      apprentices,
    });

    const response = await axios.post(
      "https://api.mjml.io/v1/render",
      {
        mjml: mjmlTemplateStr,
      },
      {
        auth: {
          username: "d10214d4-94bc-4394-91ad-4aeb8ae82e72",
          password: "16e3fb2d-a540-46e8-bebd-bddd881db248",
        },
      }
    );

    const eresponse = await strapi.plugins["email"].services.email.send({
      ...EMAIL_SETTINGS,
      to: manager.email,
      html: response.data.html,
      subject: `Your axie end of day report for ${yesterdayDateFormattedFull}`,
    });

    console.log(eresponse);

    return "sent eod report for manager " + manager?.name;
  } catch (err) {
    if (err) {
      throw err;
    }
  }
}

async function worker(accountId) {
  // Get yesterday's daily slp.
  const yesterday = new Date(); // date is in UTC
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
    account.slp.total - account.slp.blockchain_related.balance; //cached slp
  try {
    const response = await axios.get(
      `https://game-api.skymavis.com/game-api/clients/${account.ronin_id}/items/1`
    ); // fetch updated slp

    if (!response.data.success) return;

    const liveInGameSLP = response.data;
    currentInGameSLP =
      liveInGameSLP.total - liveInGameSLP.blockchain_related.balance;
  } catch (err) {
    console.error(err);
  }

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
  console.log("done running daily slp worker!");

  const managers = await strapi.query("user", "users-permissions").find({
    endOfDayReports: true,
  });

  /** @todo: add currency setting on reports my accounts page */
  // const currency = "php"; // PHP is the default currency for now
  // const slpPrices = await strapi.services["slp-logs"].getSLPPrice();
  // const currentSLP = slpPrices["data"]["smooth-love-potion"][currency];
  // const formattedCurrency = `${currency.toUpperCase()} ${currentSLP}`;

  for (const manager of managers) {
    const result = await emailQueue.push(manager);
    console.log(result);
  }
  console.log("done running end of day worker!");
}

module.exports = {
  run,
};
