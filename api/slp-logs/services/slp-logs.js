"use strict";
const ObjectId = require("mongoose").Types.ObjectId;
const axios = require("axios");
const qs = require("querystring");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async find(params, populate) {
    const account = params?.account;

    const limit = params?.limit ? parseInt(params.limit) : 100;

    if (account) {
      const logs = await strapi.query("slp-logs").model.aggregate([
        {
          $match: {
            account: ObjectId(account),
          },
        },
        {
          $lookup: {
            from: "apprentices",
            let: { account: "$account" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$account", "$$account"],
                  },
                },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  manager_share: "$manager_share",
                  apprentice_share: "$apprentice_share",
                },
              },
            ],
            as: "apprentice",
          },
        },
        {
          $unwind: {
            path: "$apprentice",
          },
        },
        {
          $project: {
            today_slp: {
              $cond: {
                if: { $lt: ["$end_slp", "$beginning_slp"] },
                then: 0,
                else: {
                  $subtract: ["$end_slp", "$beginning_slp"],
                },
              },
            },
            manager_share: "$apprentice.manager_share",
            apprentice_share: "$apprentice.apprentice_share",
            createdAt: "$createdAt",
          },
        },
        {
          $project: {
            today_slp: "$today_slp",
            manager_slp: {
              $multiply: ["$today_slp", "$manager_share"],
            },
            apprentice_slp: {
              $multiply: ["$today_slp", "$apprentice_share"],
            },
            createdAt: "$createdAt",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            today_slp: {
              $sum: "$today_slp",
            },
            manager_slp: {
              $sum: {
                $round: ["$manager_slp", 1],
              },
            },
            apprentice_slp: {
              $sum: {
                $round: ["$apprentice_slp", 1],
              },
            },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      return logs;
    } else {
      return strapi.query("slp-logs").find(params, populate);
    }
  },
  async getSLPPrice() {
    const _query = qs.stringify({
      ids: "smooth-love-potion,axie-infinity,ethereum",
      vs_currencies: `btc,eth,ltc,bch,bnb,eos,xrp,xlm,link,dot,yfi,usd,aed,ars,aud,bdt,bhd,bmd,brl,cad,chf,clp,cny,czk,dkk,eur,gbp,hkd,huf,idr,ils,inr,jpy,krw,kwd,lkr,mmk,mxn,myr,ngn,nok,nzd,php,pkr,pln,rub,sar,sek,sgd,thb,try,twd,uah,vef,vnd,zar,xdr,xag,xau,bits,sats`,
    });

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?${_query}`
    );
    return response;
  },
};
