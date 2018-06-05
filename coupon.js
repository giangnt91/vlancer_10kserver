var express = require('express'), http = require('http');
var app = express();
var bodyParser = require('body-parser');
var device = require('express-device');
var multer = require('multer');
var schedule = require('node-schedule');
var dateFormat = require('dateformat');
var FCM = require('fcm-node');

// library for socket.io
var http = http.Server(app);
var io = require('socket.io')(http);
// end library
port = process.env.port || 2018;

app.use(express.static('./img/'));

app.use(express.static('./node_modules/socket.io-client/dist/'));


/*
schedule function
1. function remove expired automatic every midnight
*/


/*
    socket get event from client
*/
io.on('connection', function (socket) {
    //back end
    socket.on('shop_create_new_coupon', function () {
        socket.broadcast.emit('get_all_coupon');
    });

    socket.on('server_accept', function () {
        socket.broadcast.emit('show_coupon_accept');
    })

    //mobile
    socket.on('user_use_coupon', function (shop_id, user_img, user_name) {
        socket.broadcast.emit('show_coupon_for_shop', shop_id, user_img, user_name);
    })

    socket.on('send_error', function (message, user_id, id) {
        socket.broadcast.emit('show_error', message, user_id, id);
    })

    schedule.scheduleJob('*/1 * * * *', function () {
        var _today = dateFormat(new Date(), "yyyymd");
        auth_model.find({}, function (err, data) {
            if (data) {
                data.forEach(element => {
                    if (element.total_list_coupon.length > 0) {
                        element.total_list_coupon.forEach(elcoupon => {
                            var _dayp = elcoupon.limit_time.split('/');
                            var _limit = _dayp[2] + _dayp[1] + _dayp[0];
                            var left_day = parseInt(_limit) - parseInt(_today);
                            // số ngày còn lại của coupon nhỏ hơn bằng 10 thì thông bao cho user
                            if (left_day <= 10) {
                                var _the_id;
                                socket.on('gcmid', function(id){
                                    _the_id = id;
                                })
                                console.log(_the_id)
                                var serverKey = 'AIzaSyBF2fdkp-vuvQy4Wt05HKgAfL9PQjMZLNw'; //put your server key here
                                var fcm = new FCM(serverKey);
                                var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                                    to: _the_id,
                                    collapse_key: 'green',

                                    notification: {
                                        title: 'Thông báo',
                                        body: 'Body of your push notification'
                                    },

                                    data: {  //you can send only notification or only data(or include both)
                                        message: 'giang den day'
                                    }
                                };

                                fcm.send(message, function (err, response) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("Successfully sent with response: ", response);
                                    }
                                });

                            }
                        });
                    }
                });
            }
        })
    })
})
/*
    End
*/

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(device.capture());
app.use(bodyParser.json());
app.use(function (req, res, next) {
    //allow connect
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    var allowedOrigins = ['http://35.200.236.251:8080', 'http://localhost:8080', 'http://localhost:8081', 'http://192.168.1.111:8100', 'http://10k.thietkewebneda.com', 'http://ad.thietkewebneda.com'];
    var origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', false);

    // Pass to next layer of middleware
    next();
})

//-- Controller --//
var auth = require('./controller/authCtrl');
var code = require('./controller/codeCtrl');
var shop = require('./controller/shopCtrl');
var action = require('./controller/actionCtrl');
var reaction = require('./controller/reactionCtrl')


//-- Api --//

// save file from upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './img/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, req.body.shopId + '-' + file.fieldname + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
})
// var upload = multer({ storage: storage }).single('avatar');
//upload multi file
var upload = multer({ storage: storage }).any();


// auth
app.post('/mobile', function (req, res) {
    auth.Mobile(req, res);
})

app.post('/couponfeed', function (req, res) {
    auth.CouponUsefeed(req, res);
})

app.post('/signin', function (req, res) {
    auth.signIn(req, res);
})

app.post('/signup', function (req, res) {
    auth.signUp(req, res);
})

app.post('/blocku', function (req, res) {
    auth.blockUser(req, res);
})

app.post('/activeu', function (req, res) {
    auth.activeUser(req, res);
})

app.post('/delu', function (req, res) {
    auth.delUser(req, res);
})

app.post('/plus', function (req, res) {
    auth.plus(req, res);
})

app.post('/updatepro', function (req, res) {
    auth.update(req, res);
})

app.post('/updatename', function (req, res) {
    auth.update_yourname(req, res);
})

app.post('/updateclass', function (req, res) {
    auth.updateClass(req, res);
})

app.post('/bad', function (req, res) {
    auth.updatePointbad(req, res);
})

app.post('/alluser', function (req, res) {
    auth.getAlluser(req, res);
})

// basic code
app.post('/basic', function (req, res) {
    code.basic_code(req, res);
})

app.post('/getbasic', function (req, res) {
    code.get_basic(req, res);
})

app.post('/updatebasic', function (req, res) {
    code.Update(req, res);
})

app.post('/removebasic', function (req, res) {
    code.Remove(req, res);
})

app.post('/imgbasic', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send({ 'error_code': 1, 'message': err });
        } else {
            code.avatar(req, res, server_url);
        }
    })
})

// shop
app.post('/cshop', function (req, res) {
    shop.shop(req, res);
})

// var server_url = 'http://localhost:2018/';
var server_url = 'http://35.200.213.108:2018/';

app.post('/img', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send({ 'error_code': 1, 'message': err });
        } else {
            shop.uploadImg(req, res, server_url);
        }
    })
});

app.post('/avatar', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send({ 'error_code': 1, 'message': err });
        } else {
            shop.avatar(req, res, server_url);
        }
    })
})

app.post('/cover', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send({ 'error_code': 1, 'message': err });
        } else {
            shop.cover(req, res, server_url);
        }
    })
})

app.post('/album', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send({ 'error_code': 1, 'message': err });
        } else {
            shop.album(req, res, server_url);
        }
    })
})

app.post('/ushop', function (req, res) {
    shop.updateShop(req, res);
})

app.post('/getshop', function (req, res) {
    shop.getall(req, res);
})

app.post('/getshopbyboss', function (req, res) {
    shop.getshopByboss(req, res);
})

app.post('/getallcoupon', function (req, res) {
    shop.getallCoupon(req, res);
})

app.post('/createcoupon', function (req, res) {
    shop.createCoupon(req, res);
})

app.post('/updatecoupon', function (req, res) {
    shop.updateCoupon(req, res);
})

app.post('/approvedc', function (req, res) {
    shop.acceptCoupon(req, res);
})

app.post('/cancelapproved', function (req, res) {
    shop.cancelCoupon(req, res);
})

app.post('/removecouponcancel', function (req, res) {
    shop.RemoveCouponShopreject(req, res);
})

app.post('/updateshopLike', function (req, res) {
    shop.updateLike(req, res);
})

app.post('/getbyshopid', function (req, res) {
    shop.getByshopid(req, res);
})

app.post('/getShopId', function (req, res) {
    shop.getShopId(req, res);
})

app.post('/getshopvip', function (req, res) {
    shop.getShopvip(req, res);
})

app.post('/musecoupon', function (req, res) {
    shop.UseruseCoupon(req, res);
})

app.post('/mshopaccept', function (req, res) {
    shop.UpdateCouponshopuse(req, res);
})

app.post('/mupdaterating', function (req, res) {
    shop.UpdateCouponRating(req, res);
})


// action
app.post('/caction', function (req, res) {
    action.create(req, res);
})

app.post('/get_action_for_user_per_day', function (req, res) {
    action.get_action_for_user_per_day(req, res);
})

app.post('/updateactionuser', function (req, res) {
    action.update_action_user(req, res);
})

app.post('/allaction', function (req, res) {
    action.getAll(req, res);
})

app.post('/updateac', function (req, res) {
    action.update_action(req, res);
})

app.post('/delac', function (req, res) {
    action.delete_action(req, res);
})

// reaction
app.post('/creaction', function (req, res) {
    reaction.create(req, res);
})

app.post('/getreac', function (req, res) {
    reaction.getAll(req, res);
})


//-- Run server --//
http.listen(port);
console.log('Server Coupon is running on port ' + port);


