var mongoose = require('mongoose');

// Connect mongodb
mongoose.createConnection('mongodb://localhost:27017/coupon10k');

// Create basic code
var code = new mongoose.Schema({
    shopId: String,
    shopImg: String,
    info_coupon: String,
    value: Array,
    code_coupon: String,
    expire_day: String,
    shopUrl: String
}, {
        versionKey: false
    });

// Create model based a schema
module.exports = mongoose.model('Basic_Coupon', code);