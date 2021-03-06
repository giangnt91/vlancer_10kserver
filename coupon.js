var express = require('./public/node_modules/express'),
	http = require('http');
var app = express();
var bodyParser = require('./public/node_modules/body-parser');
var device = require('./public/node_modules/express-device');
var multer = require('./public/node_modules/multer');
var schedule = require('./public/node_modules/node-schedule');
var dateFormat = require('./public/node_modules/dateformat');

var FCM = require('./public/node_modules/fcm-node');
var FCM2 = require('./node_modules/fcm-notification');
var fcmKey = new FCM2('./firebase/i-studio-184006-firebase-adminsdk-p6ua2-7e3845a9f4.json');

// library for socket.io
// const fs = require('./public/node_modules/fs');

var http = http.Server(app);
var io = require('./public/node_modules/socket.io')(http);
// end library
port = process.env.port || 2018;

app.use(express.static('./public/img/'));

app.use(express.static('./node_modules/socket.io-client/dist/'));

/*Firebase Function*/
function pushFCM(sms, userId, notif) {

	var message = {
		data: {
			title: 'Thông Báo',
			message: sms,
			sound: 'default',
			vibrate: "true",
			userid: userId
		},
		notification: {
			title: 'Thông Báo',
			body: sms
		},
		token: notif
	};

	fcmKey.send(message, function (err, response) {
		if (err) {
			console.log('error found', err);
		} else {
			// console.log('response here', response);
		}
	})
}

function fireBase(sms, userId, notif) {
	// var serverKey = './firebase/i-studio-184006-firebase-adminsdk-p6ua2-0d1fe2f556.json';
	var fcm = new FCM('AIzaSyACfkIkBA_4gv19gRhK1goKKNVMyl5-twA');
	var message = {
		to: notif,
		collapse_key: 'green',

		data: {
			title: 'Thông Báo',
			message: sms,
			sound: 'default',
			vibrate: "true",
			userid: userId
		}
	};

	fcm.send(message, function (err, response) {
		if (err) {
			console.log('fireBase error : ' + err);
		} else {
			// console.log('Send cho: ' +element.info[0].fulname);
		}
	});
}

/*
schedule function
1. function remove expired automatic every midnight
 */
// */1 * * * *
schedule.scheduleJob('0 0 9 * *', function () {
	var _today = dateFormat(new Date(), "yyyymmdd");
	auth_model.find({}, function (err, data) {
		if (data) {
			data.forEach(element => {
				if (element.total_list_coupon.length > 0) {
					element.total_list_coupon.forEach(elcoupon => {
						var _dayp = elcoupon.limit_time.split('/');
						var _limit = _dayp[2] + _dayp[1] + _dayp[0];
						var left_day = parseInt(_limit) - parseInt(_today);
						// số ngày còn lại của coupon nhỏ hơn bằng 10 thì thông báo cho user
						if (left_day < 10 && left_day > 0) {
							var _message = "Coupon của cửa hàng " + elcoupon.shop_name + " còn " + left_day + " ngày nữa là hết hạn. Vui lòng sử dụng Coupon trước ngày " + elcoupon.limit_time + "."
							var userid = elcoupon.userid_get_coupon[0].id;

							// pushFCM(_message, element.user_id, element.notif);
							fireBase(_message, element.user_id, element.notif);
						}
					});
				}
			});
		}
	})
})

// kiểm tra trùng trong mảng dữ liệu
Array.prototype.contains = function (obj) {
	var i = this.length;
	while (i--) {
		if (this[i].id === obj) {
			return i;
		}
	}
	return false;
}

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

	// gift
	const giftModel = require('./public/model/gift');

	socket.on('user_get_gift', (uId, shopId, shopName) => {
		socket.broadcast.emit('get_gifts', uId);

		// thông báo cho user
		auth_model.findById(uId, function (err, data) {
			if (err) {
				console.log('lấy thông tin user nhận quà có lỗi: ' + err);
			} else {
				if (data) {
					// gửi thông báo khi user lấy quà mới
					let sms = 'Bạn đã lấy thành công phần quà của Shop ' + shopName;
					fireBase(sms, uId, data.notif);
				}
			}
		});

		// thông báo cho shop
		shop_model.findById(shopId, function (err, data) {
			if (err) {
				console.log('Lấy thông tin shop user nhận quà có lỗi: ' + err);
			} else {
				if (data) {
					auth_model.findById(uId, (err, user) => {
						if (err) {
							console.log('lấy thông tin chủ shop có lỗi: ' + err)
						} else {
							// thông báo user lấy gift
							let sms = 'Thành viên ' + user.info[0].fulname + ' đã lấy thành công phần quà của Shop';
							fireBase(sms, user.user_id, user.notif);
						}
					})
				}
			}
		});

	})

	socket.on('user_use_gift', () => {
		socket.broadcast.emit('shop_check_request_gift');
	})

	socket.on('shop_review_gift', (auth, gift) => {
		// cập nhật người đang review gift
		giftModel.findById(gift._id, (err, data) => {
			if (err) {
				console.log('error coupon.js line 167: ' + err);
			} else {
				try {
					let index = data.giftListUserUse.contains(gift.auth.id);
					newAuth = {
						id: data.giftListUserUse[index].id,
						name: data.giftListUserUse[index].name,
						image: data.giftListUserUse[index].image,
						reviewid: auth._id,
						reviewname: auth.info[0].fulname,
						reviewimage: auth.user_img,
						status: 1
					}
					data.giftListUserUse.splice(index, 1);
					data.giftListUserUse.unshift(newAuth);
					data.save(err => {
						if (err) {
							console.log('error coupon line 194: ' + err);
						}
					})
				} catch (err) {
					console.log('error coupon line 172: ' + err);
				}
			}
		});

		setTimeout(() => {
			socket.broadcast.emit('shop_in_review_gift');
		}, 500);

	})

	socket.on('notif_gift', (sms, shopImg, userId, idNotif) => {
		socket.broadcast.emit('show_notif_gift', sms, shopImg, userId, idNotif);
	})

	//mobile
	socket.on('user_get_coupon', function (uid, shop_id, shop_name) {
		socket.broadcast.emit('user_mobile', uid);

		// thông báo cho user
		auth_model.findOne({
			user_id: uid
		}, function (err, data) {
			if (err) {
				console.log('User Get Coupon ' + err);
			} else {
				if (data !== null && data !== undefined && data.length > 0) {
					// gửi thông báo khi user lấy coupon mới
					let sms = 'Bạn đã lấy thành công Coupon của Shop ' + shop_name;
					// pushFCM(sms, uid, data.notif);
					fireBase(sms, uid, data.notif);

					// kiểm tra slot của user
					if (data.empty_slot === 0) {
						let smsEmpty = 'Bạn đã sử dụng hết lượt lấy coupon hay sử dụng Coupon để có thể lấy thêm Coupon mới';
						// pushFCM(smsEmpty, uid, data.notif);
						fireBase(smsEmpty, uid, data.notif);
					}
				}
			}
		})

		// thông báo cho shop
		shop_model.findById(shop_id, function (err, data) {
			if (err) {
				console.log('Shop user get coupon ' + err);
			} else {
				if (data !== null && data !== undefined && data.length > 0) {
					auth_model.findOne({
						user_id: data.shop_boss
					}, function (err, udata) {
						if (err) {
							console.log('Shop user get coupon for boss ' + err);
						} else {
							if (udata !== null && udata !== undefined && udata.length > 0) {
								// thông báo user lấy coupon
								let sms = 'Thành viên ' + udata.info[0].fulname + ' đã lấy thành công Coupon của Shop';
								// pushFCM(sms, udata.user_id, udata.notif);
								fireBase(sms, udata.user_id, udata.notif);

								// thông báo shop hết coupon
								if (data.server_coupon.length === 0 && data.shop_coupon.length === 0) {
									let sms = 'Shop đã hết Coupon của đợt phát hành gần nhất';
									// pushFCM(sms, data.shop_boss, udata.notif);
									fireBase(sms, udata.shop_boss, udata.notif);
								}
							}
						}
					});
				}
			}
		})

	})

	socket.on('user_use_coupon', function (shop_id, coupon_id, _id) {
		socket.broadcast.emit('show_coupon_for_shop', shop_id, coupon_id, _id);
	})

	socket.on('send_error', function (message, user_id, id) {
		socket.broadcast.emit('show_error', message, user_id, id);
	})

	//1 connect to coupon for shop
	socket.on('oneconnect', function (shopid, couponid, userid, fulname, avatar) {

		// cập nhật reviewedby cho shop
		shop_model.find({
			shopId: shopid
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				if (data.length > 0) {
					var shop_use_coupon = data[0].shop_use_coupon;
					if (shop_use_coupon.length > 0) {
						shop_use_coupon.forEach(element => {
							if (element.coupon._id === couponid) {

								_coupon = {
									checkId: element.coupon.checkId,
									reviewedby: [{
										userId: userid,
										userName: fulname,
										img: avatar
									}],
									loyal: [{
										id: element.coupon.loyal[0].name,
										name: element.coupon.loyal[0].id
									}],
									shop_name: element.coupon.shop_name,
									shop_cover: element.coupon.shop_cover,
									shop_avatar: element.coupon.shop_avatar,
									shop_id: element.coupon.shop_id,
									coupon_info: element.coupon.coupon_info,
									value: element.coupon.value,
									class_user: [{
										id: element.coupon.class_user[0].id,
										name: element.coupon.class_user[0].name
									}],
									release_day: element.coupon.release_day,
									limit_time: element.coupon.limit_time,
									time_expire: element.coupon.time_expire,
									the_issuer: [{
										id: element.coupon.the_issuer[0].id,
										name: element.coupon.the_issuer[0].name
									}],
									status_coupon: [{
										id: 0,
										status: "Đã sử dụng"
									}],
									userid_get_coupon: element.coupon.userid_get_coupon,
									time_user_get: element.coupon.time_user_get,
									time_user_use: element.time_user_use,
									rating: element.coupon.rating,
									rfeedback: [{
										name: element.coupon.rfeedback[0].name,
										id: element.coupon.rfeedback[0].id
									}],
									feedback: element.coupon.feedback,
									approved: element.coupon.approved,
									_id: element.coupon._id
								}

								the_new = {
									_id: element._id,
									approved: 'pending',
									coupon: _coupon
								}
								shop_use_coupon.splice(shop_use_coupon.indexOf(element), 1);

							}
						});
					}
					shop_use_coupon.push(the_new);
					data[0].shop_use_coupon = shop_use_coupon;
					data[0].save(function (err) {
						if (err) {
							console.log(err);
						}
					})
				}
			}
		})

		// cập nhật reviewedby cho user
		auth_model.find({
			user_id: userid
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				if (data[0].total_list_coupon.length > 0) {
					var total_list_coupon = data[0].total_list_coupon;

					total_list_coupon.forEach(element => {
						if (element._id === couponid) {
							the_new = {
								checkId: element.checkId,
								reviewedby: [{
									userId: userid,
									userName: fulname,
									img: avatar
								}],
								loyal: [{
									id: element.loyal[0].name,
									name: element.loyal[0].id
								}],
								shop_name: element.shop_name,
								shop_cover: element.shop_cover,
								shop_avatar: element.shop_avatar,
								shop_id: element.shop_id,
								coupon_info: element.coupon_info,
								value: element.value,
								class_user: [{
									id: element.class_user[0].id,
									name: element.class_user[0].name
								}],
								release_day: element.release_day,
								limit_time: element.limit_time,
								time_expire: element.time_expire,
								the_issuer: [{
									id: element.the_issuer[0].id,
									name: element.the_issuer[0].name
								}],
								status_coupon: element.status_coupon,
								userid_get_coupon: element.userid_get_coupon,
								time_user_get: element.time_user_get,
								time_user_use: element.time_user_use,
								rating: element.rating,
								rfeedback: [{
									name: element.rfeedback[0].name,
									id: element.rfeedback[0].id
								}],
								feedback: element.feedback,
								approved: "pending",
								_id: element._id
							}
							total_list_coupon.splice(total_list_coupon.indexOf(element), 1);
							total_list_coupon.push(the_new);
						}
					});

					data[0].total_list_coupon = total_list_coupon;
					data[0].save(function (err) {
						if (err) {
							response = {
								'error_code': 3,
								'message': 'error update data'
							};
						} else {
							response = {
								'error_code': 0,
								'message': 'Update coupon pending success'
							};
						}
						res.status(200).json(response);
					})
				}
			}
		})

		socket.broadcast.emit('disableconnect', couponid, fulname, avatar);
	})
})
/*
End
 */

app.use(bodyParser.urlencoded({
	extended: true,
	limit: '50mb'
}));
app.use(device.capture());
app.use(bodyParser.json({
	limit: '50mb'
}));
app.use(function (req, res, next) {
	//allow connect
	// res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
	var allowedOrigins = ['http://35.240.165.98:8080', 'http://localhost:8080', 'http://localhost:8081', 'http://192.168.1.111:8100', 'https://coupon10k.com', 'https://shop.coupon10k.com'];
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
const auth = require('./public/controller/authCtrl');
const code = require('./public/controller/codeCtrl');
const shop = require('./public/controller/shopCtrl');
const action = require('./public/controller/actionCtrl');
const reaction = require('./public/controller/reactionCtrl')
const hotDeal = require('./public/controller/hotCtrl');
const accessTrade = require('./public/controller/accesstradeCtrl');
const gift = require('./public/controller/giftCtrl');


//-- Api --//

// save file from upload
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/img/')
	},
	filename: function (req, file, cb) {
		var datetimestamp = Date.now();
		cb(null, req.body.shopId + '-' + file.fieldname + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
	}
})
// var upload = multer({ storage: storage }).single('avatar');
//upload multi file
var upload = multer({
	storage: storage
}).any();

// AccessTrade
app.get('/transactiongetbyuser', function (req, res) {
	accessTrade.TransactionsGetByUserId(req, res);
})

app.get('/transactiongetall', function (req, res) {
	accessTrade.TransactionsGetAll(req, res);
})

app.post('/setcommission', (req, res) => {
	accessTrade.Setting(req, res);
})

app.get('/getcommission', (req, res) => {
	accessTrade.getSetting(req, res);
})
//

// Gift
app.post('/addgift', (req, res) => {
	gift.giftAddNew(req, res);
})

app.get('/getgifts', (req, res) => {
	gift.giftGetAll(req, res);
})

app.post('/editgift', (req, res) => {
	gift.giftEdit(req, res);
})

app.get('/getgift', (req, res) => {
	gift.giftGetById(req, res);
})

app.post('/updateusergetgift', (req, res) => {
	gift.giftUpdateUserGet(req, res);
})

app.post('/updateuserexpire', (req, res) => {
	gift.giftUpdateExpire(req, res);
})

app.post('/userusegift', (req, res) => {
	gift.giftUserUse(req, res);
})

app.post('/giftrmuseruse', (req, res) => {
	gift.giftRemoveUserUse(req, res);
})

app.get('/shopgetgiftrequest', (req, res) => {
	gift.giftGetRequest(req, res);
})

app.post('/giftacceptforshop', (req, res) => {
	gift.giftAcceptRequestForShop(req, res);
})

app.post('/giftacceptforuser', (req, res) => {
	gift.giftAcceptRequestForUser(req, res);
})
// End Gift

// auth
app.post('/authtoken', function (req, res) {
	auth.authToken(req, res);
})

app.post('/minuspoints', function (req, res) {
	auth.Minuspoints(req, res);
})

app.post('/accesstoken', function (req, res) {
	auth.AcessToken(req, res);
})

app.post('/checkin', function (req, res) {
	auth.CheckinLoyal(req, res);
})

app.post('/mobile', function (req, res) {
	auth.Mobile(req, res);
})

app.post('/rcoupon', function (req, res) {
	auth.RemoveCoupon(req, res);
})

app.post('/notifid', function (req, res) {
	auth.UpdateuserNotif(req, res);
})

app.post('/waitshopapproved', function (req, res) {
	auth.waitShopApproved(req, res);
})

app.post('/timeoutuser', function (req, res) {
	auth.timeOutUser(req, res);
})

app.post('/couponfeed', function (req, res) {
	auth.CouponUsefeed(req, res);
})

app.post('/afteruser', function (req, res) {
	auth.UpdateAfterUse(req, res);
})

app.post('/signin', function (req, res) {
	auth.signIn(req, res);
})

app.post('/signout', function (req, res) {
	auth.signOut(req, res);
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

app.post('/cslider', function (req, res) {
	code.Slider(req, res);
})

app.post('/getslider', function (req, res) {
	code.getSlider(req, res);
})

app.post('/rmslider', function (req, res) {
	code.rmSlider(req, res);
})

app.post('/getemarket', function (req, res) {
	code.getEmarket(req, res);
})

app.post('/emarket', function (req, res) {
	code.emarket(req, res);
})

app.post('/updateemarket', (req, res) => {
	code.updateEmarket(req, res);
})

app.post('/updateemarketforcode', (req, res) => {
	code.updateEmarketForCode(req, res)
})

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
			res.send({
				'error_code': 1,
				'message': err
			});
		} else {
			code.avatar(req, res, server_url);
		}
	})
})

// Hot Deal
app.post('/chotdeal', (req, res) => {
	hotDeal.hotDealCreate(req, res);
})

app.get('/gethotdeal', (req, res) => {
	hotDeal.hotDealGetAll(req, res);
})

app.post('/updatehotdeal', (req, res) => {
	hotDeal.hotDealUpdateById(req, res);
})

app.post('/delhotdeal', (req, res) => {
	hotDeal.hotDealDelById(req, res);
})
// End Hot Deal

// shop
app.post('/cshop', function (req, res) {
	shop.shop(req, res);
})

// var server_url = 'http://localhost:2018/';
// var server_url = 'http://35.240.165.98:2018/';
var server_url = 'https://api.coupon10k.com/';

app.post('/slider', function (req, res) {
	upload(req, res, function (err) {
		if (err) {
			res.send({
				'error_code': 1,
				'message': err
			});
		} else {
			code.upSlider(req, res, server_url);
		}
	})
});

app.post('/img', function (req, res) {
	upload(req, res, function (err) {
		if (err) {
			res.send({
				'error_code': 1,
				'message': err
			});
		} else {
			shop.uploadImg(req, res, server_url);
		}
	})
});

app.post('/avatar', function (req, res) {
	upload(req, res, function (err) {
		if (err) {
			res.send({
				'error_code': 1,
				'message': err
			});
		} else {
			var img = JSON.parse(req.body.img);
			avatar = server_url + img[0].avatar;
			res.status(200).json({
				'error_code': 0,
				'url': avatar
			});
			// shop.avatar(req, res, server_url);
		}
	})
})

app.post('/cover', function (req, res) {
	upload(req, res, function (err) {
		if (err) {
			res.send({
				'error_code': 1,
				'message': err
			});
		} else {
			var img = JSON.parse(req.body.img);
			cover = server_url + img[0].cover;
			res.status(200).json({
				'error_code': 0,
				'url': cover
			});
			// shop.cover(req, res, server_url);
		}
	})
})

app.post('/album', function (req, res) {
	upload(req, res, function (err) {
		if (err) {
			res.send({
				'error_code': 1,
				'message': err
			});
		} else {
			var img = JSON.parse(req.body.img);
			var _album = [];
			img[0].album.forEach(function (item) {
				_album.push({
					url: server_url + item
				});
			});
			album = _album;
			res.status(200).json({
				'error_code': 0,
				'url': album
			});
			// shop.album(req, res, server_url);
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

app.post('/getshopbyid', function (req, res) {
	shop.getShopbyId(req, res);
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

app.post('/timeoutcoupon', function (req, res) {
	shop.TimeoutCoupon(req, res);
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

	// gửi thông báo cho shop khi user sử dụng coupon
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
console.log('Server Coupon is running on https port ' + port);