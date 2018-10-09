var mongoose = require('mongoose');

// Connect mongodb
// mongoose.createConnection('mongodb://localhost:27017/coupon10k');
mongoose.createConnection('mongodb://cp_sa:91411902@localhost:19899/coupon10k');

// Create basic code
var Emarket = new mongoose.Schema({
    Ename: String,
    Eimg: String,
}, {
        versionKey: false
    });

// Create model based a schema
module.exports = mongoose.model('Emarket', Emarket);