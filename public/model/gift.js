const mongoose = require('../config/cp_db');

// Create basic code
var gift = new mongoose.Schema({
  giftShop: Array,
  giftName: String,
  giftPrice: String,
  giftPoint: Number,
  giftInfo: String,
  giftCreateDay: String,
  giftCreateDayIso: Date,
  giftExpiredDay: String,
  giftExpiredDayIso: Date,
  giftUseDay: String,
  giftUseDayIso: Date,
  giftAddress: String,
  giftTotal: Number,
  giftUserHasTaken: Number,
  giftImages: Array,
  giftListUser: Array,
  giftListUserUse: Array,
  giftTurn: String,
  giftDisable: Boolean
}, {
    versionKey: false
  });

// Create model based a schema
module.exports = mongoose.model('Gifts', gift);