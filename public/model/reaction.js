const mongoose = require('../config/cp_db');

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