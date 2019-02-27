const mongoose = require('../config/cp_db');

// Create basic code
var code = new mongoose.Schema({
    Eid: String,
    Ename: String,
    Eimg: String,
    Code: String,
    Url: String,
    Industry: String,
    Info: String,
    ValueC: Array,
    Expireday: String,
	Releaseday: String,
	_Status: Array
	}, {
	versionKey: false
});

// Create model based a schema
module.exports = mongoose.model('Basic_Coupon', code);