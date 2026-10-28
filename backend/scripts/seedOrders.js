require("dotenv").config();
const mongoose = require("mongoose");
const { OrdersModel } = require("../model/OrdersModel");

const SYMBOLS = ["INFY", "TCS", "RELIANCE", "HDFCBANK", "ITC", "WIPRO", "SBIN", "M&M", "BAJAJ-AUTO", "ONGC"];
const BASE = [1550, 3300, 2450, 1650, 440, 480, 780, 2900, 9000, 270];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  if (process.argv.includes("--reset")) await OrdersModel.deleteMany({});

  const docs = [];
  for (let i = 0; i < 120; i++) {
    const s = Math.floor(Math.random() * SYMBOLS.length);
    const qty = 1 + Math.floor(Math.random() * 60);
    const price = +(BASE[s] * (0.9 + Math.random() * 0.2)).toFixed(2);
    docs.push({
      name: SYMBOLS[s],
      qty,
      price,
      value: +(qty * price).toFixed(2),
      mode: pick(["BUY", "SELL"]),
      product: pick(["CNC", "MIS", "NRML"]),
      status: pick(["COMPLETE", "COMPLETE", "COMPLETE", "PENDING", "CANCELLED", "REJECTED"]),
      executedAt: new Date(Date.now() - Math.random() * 60 * 24 * 3600 * 1000),
    });
  }
  await OrdersModel.insertMany(docs);
  console.log(`Inserted ${docs.length} orders`);
  await mongoose.disconnect();
})();