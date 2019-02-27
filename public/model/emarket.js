const mongoose = require('../config/cp_db');

// Create basic code
var Emarket = new mongoose.Schema({
    Ename: String,
    Eimg: String,
}, {
        versionKey: false
    });

// Create model based a schema
module.exports = mongoose.model('Emarket', Emarket);