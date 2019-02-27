const mongoose = require('../config/cp_db');

// create coupon code
var coupon = mongoose.Schema({
    value: Number,
    shop_name: String,
    shop_avatar: String,
    shop_cover: String,
    class_user: Array,
    coupon_info: String,
    shop_id: String,
    userid_get_coupon: String,
    release_date: String,
    the_issuer: Array,
    time_user_get: String,
    time_expire: String,
    time_user_use: String,
    approved: Boolean,
    rating: Number,
    feedback: String,
    status_coupon: Array
}, { versionKey: false });

// create model based a schema
module.exports = mongoose.model('coupons', coupon);