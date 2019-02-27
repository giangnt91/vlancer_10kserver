const mongoose = require('../config/cp_db');

// Create basic code
var slider = new mongoose.Schema({
    ShopId: String,
    Button: String,
    Url: String,
    Image: String,
}, {
        versionKey: false
    });

// Create model based a schema
module.exports = mongoose.model('Slider', slider);