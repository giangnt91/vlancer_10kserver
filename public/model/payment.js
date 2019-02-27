const mongoose = require('../config/cp_db');

var payment = mongoose.Schema({
  authBuy: Array,
  transactionId: String,
  originName: String,
  productName: String,
  productPrice: Number,
  productCommission: Number,
  rewardPoint: Number,
  dayBuy: String,
  dayBuyIso: Date,
  dayComfirm: String,
  dayComfirmIso: Date,
  isUse: Boolean,
  paymentStatus: Array
}, {
    versionKey: false
  });

// Create model based a schema
module.exports = mongoose.model('Payment', payment);