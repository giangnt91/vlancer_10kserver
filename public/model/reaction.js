var mongoose = require('mongoose');

// connect mongodb
// mongoose.createConnection('mongodb://localhost:27017/coupon10k');
mongoose.createConnection('mongodb://cp_sa:91411902@localhost:19899/coupon10k');

// social schema
var reaction = mongoose.Schema({
    kind_reaction: Array,
    id_post_reaction: String,
    url_post_reaction: String,
    click_reaction_day: String,
    id_shop: String,
    id_user: String
}, { versionKey: false });

// create model based social schema
module.exports = mongoose.model('Reaction', reaction);