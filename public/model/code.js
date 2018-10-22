var mongoose = require('mongoose');

// Connect mongodb
// mongoose.createConnection('mongodb://localhost:27017/coupon10k');
mongoose.createConnection('mongodb://cp_sa:91411902@localhost:19899/coupon10k');

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