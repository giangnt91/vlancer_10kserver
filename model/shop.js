var mongoose = require('mongoose');

// connect mongodb
mongoose.createConnection('mongodb://localhost:27017/coupon10k');

// create shop
var shop = mongoose.Schema({
    shopId: String,
    shop_boss: String,
    shop_manager: Array,
    user_like_shop: Array,
    shop_coupon: Array,
    server_coupon: Array,
    user_get_coupon: Array,
    expire_coupon: Array,
    shop_use_coupon: Array,
    wallet: Number,
    shop_status: Array,
    shop_rank: Array,
    shop_info: Array
}, { versionKey: false })

// create model based a schema
module.exports = mongoose.model('Shops', shop);