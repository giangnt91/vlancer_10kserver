const mongoose = require('../config/cp_db');

// action schema
var action = new mongoose.Schema({
	action_kind: Number,
	action_url: String,
	action_id: String,
	action_shop_id: String,
	action_user: Array,
	action_releaseday: String,
	action_expiredday: String,
	action_likemax: Number,
	action_like: Number,
	action_commentmax: Number,
	action_comment: Number,
	action_status: Array
}, { versionKey: false });

//create model base action schema
module.exports = mongoose.model('Actions', action);