const mongoose = require('../config/cp_db');

// Sign up
var user = new mongoose.Schema({
    user_id: String,
    user_img: String,
    info: Array,
    point_per_day: Number,
    point_per_today: Number,
    total_slot: Number,
    user_class: Array,
    download: Boolean,
    access_time_per_day: Array,
    point_plus: Number,
    point_bad: Number,
    total_list_coupon: Array,
    empty_slot: Number,
    use_coupon: Array,
    call_server_in_day: Array,
    role: Array,
    notif: String,
    loyal: Array,
	regday: String,
	regdayiso: Date,
	access_token: String,
	likecount: Number,
	commentcount: Number,
    _status: Array
}, {
        versionKey: false
    });

// Create model based a schema
module.exports = mongoose.model('Users', user);