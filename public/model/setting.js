const mongoose = require('../config/cp_db');

// social schema
var setting = mongoose.Schema({
    commission: Number
}, { versionKey: false });

// create model based social schema
module.exports = mongoose.model('Setting', setting);