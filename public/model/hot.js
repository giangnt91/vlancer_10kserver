const mongoose = require('../config/cp_db');

// Create basic code
var hot = new mongoose.Schema({
  urlImage: String,
  Info: String,
  urlCommission: String,
  expiredDay: String,
  expiredDayIso: Date,
  createDay: String,
  createDayIso: Date
}, {
    versionKey: false
  });

// Create model based a schema
module.exports = mongoose.model('HotDeals', hot);