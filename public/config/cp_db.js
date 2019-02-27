const mongoose = require('mongoose');

// -- Connect DB -- //
mongoose.connect('mongodb://cp_sa:91411902@localhost:19899/coupon10k', { useNewUrlParser: true });

module.exports = exports = mongoose;