const mongoose = require('mongoose');

// -- Connect DB -- //
mongoose.connect('mongodb://cp_sa:91411902@localhost:19899/coupon10k', {
   useNewUrlParser: true
});
// mongoose.connect('mongodb://cp_sa:91411902@35.244.36.175:19899/coupon10k', { useNewUrlParser: true });

module.exports = exports = mongoose;