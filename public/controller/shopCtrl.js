var mongoose = require('mongoose');
var schedule = require('node-schedule');
var dateFormat = require('dateformat');

// get model
shop_model = require('../model/shop');
auth_model = require('../model/auth');
var FCM = require('../node_modules/fcm-node');
var FCM2 = require('../node_modules/fcm-notification');
var fcmKey = new FCM2('./firebase/i-studio-184006-firebase-adminsdk-p6ua2-7e3845a9f4.json');

//conver day to int for compare
function process(x) {
	var parts = x.split("/");
	return parts[2] + parts[1] + parts[0];
}

// check coupon expired
function remove_coupon_expired() {
	// var _today = dateFormat(new Date(), "yyyymmdd");
	var _today = dateFormat(new Date(), "yyyymmdd");

	shop_model.find({}, function (err, data) {
		var _arr = []
		if (data !== undefined) {
			data.forEach(element => {
				if (element.shop_coupon.length > 0) {
					if (element.shop_coupon[0].approved === true) {
						_arr = element.expire_coupon;
						var _expire_day = process(element.shop_coupon[0].coupon[0].limit_time);
						if (_expire_day < _today) {
							element.shop_coupon[0].coupon.forEach(el => {
								el.status_coupon = [{
										id: 2,
										status: "Hết hạn và chưa sử dụng"
									}
								]
								_arr.push(el);
								element.shop_coupon = [];
								element.expire_coupon = _arr
									element.save(function (err) {
										if (err)
											return err;
									})
							});
						}
					}

				}
				if (element.server_coupon.length > 0) {
					_arr = element.expire_coupon;
					var _expire_day = process(element.server_coupon[0].coupon[0].limit_time);
					if (_expire_day < _today) {
						element.server_coupon[0].coupon.forEach(el => {
							el.status_coupon = [{
									id: 2,
									status: "Hết hạn và chưa sử dụng"
								}
							]
							_arr.push(el);
							element.server_coupon = [];
							element.expire_coupon = _arr
								element.save(function (err) {
									if (err)
										return err;
								})
						});
					}
				}
			});
		}

	});
}

/*
schedule function
1. function remove expired automatic every midnight
 */
schedule.scheduleJob('0 0 * * *', function () {
	remove_coupon_expired();
})

// schedule.scheduleJob('*/5 * * * * *', function () {
//     remove_coupon_expired();
// })
// api
module.exports = {
	// create new shop
	shop: function (req, res) {
		shop_model.find({
			$or: [{
					shopId: req.body.shopId
				}, {
					shop_boss: req.body.shop_boss
				}
			]
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				if (data.length > 0) {
					response = {
						'error_code': 4,
						'message': 'Shop hoặc Chủ shop đã tồn tại!'
					};
				} else {

					var shop = new shop_model({
							shopId: req.body.shopId,
							shop_boss: req.body.shop_boss,
							shop_manager: req.body.shop_manager,
							shop_coupon: req.body.shop_coupon,
							server_coupon: req.body.server_coupon,
							user_get_coupon: req.body.user_get_coupon,
							expire_coupon: req.body.expire_coupon,
							shop_use_coupon: req.body.shop_use_coupon,
							wallet: req.body.wallet,
							shop_status: JSON.parse(req.body.shop_status),
							shop_rank: JSON.parse(req.body.shop_rank),
							shop_info: JSON.parse(req.body.shop_info)
						});

					shop.save(function (err, data) {
						if (err) {
							response = {
								'error_code': 2,
								'message': 'error create new shop'
							};
						} else {
							response = {
								'error_code': 0,
								'shop_id': data._id
							};
						}
						res.status(200).json(response);
					});
				}
			}
		});
	},
	getall: function (req, res) {
		shop_model.find({}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'error_message': 'error fetching data'
				};
			} else {
				response = {
					'error_code': 0,
					'shop': data
				};
			}
			res.status(200).json(response);
		});
	},
	getshopByboss: function (req, res) {
		shop_model.find({
			shop_boss: req.body.boss
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'error_message': 'error fetching data'
				};
			} else {
				if (data.length === 0) {
					response = {
						'error_code': 2,
						'shop': ''
					};
				} else {
					response = {
						'error_code': 0,
						'shop': data
					};
				}
				res.status(200).json(response);
			}
		})
	},
	getShopbyId: function (req, res) {
		shop_model.findById(req.body._id, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'error_message': 'error fetching data'
				};
			} else {
				response = {
					'error_code': 0,
					'shop': data
				};
				res.status(200).json(response);
			}
		})
	},
	getallCoupon: function (req, res) {
		shop_model.find({}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var shop = [];
				var server = [];
				var user_get_coupon = [];
				var shop_use_coupon = [];
				var expire_coupon = [];

				data.forEach(element => {
					if (element.shop_coupon.length > 0) {
						element.shop_coupon.forEach(coupon => {
							shop.push(coupon);
						});
					}
					if (element.server_coupon.length > 0) {
						element.server_coupon.forEach(coupon => {
							server.push(coupon);
						});
					}
					if (element.user_get_coupon.length > 0) {
						element.user_get_coupon.forEach(coupon => {
							user_get_coupon.push(coupon);
						});
					}
					if (element.shop_use_coupon.length > 0) {
						element.shop_use_coupon.forEach(coupon => {
							shop_use_coupon.push(coupon);
						});
					}
					if (element.expire_coupon.length > 0) {
						element.expire_coupon.forEach(coupon => {
							expire_coupon.push(coupon);
						});
					}
				});
				all = {
					shop: shop,
					server: server,
					user_get_coupon: user_get_coupon,
					shop_use_coupon: shop_use_coupon,
					expire_coupon: expire_coupon
				}
				response = {
					'error_code': 0,
					'coupon': all
				};
			}
			res.status(200).json(response);
		});
	},
	createCoupon: function (req, res) {
		shop_model.findById(req.body._id, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'error_message': 'error fetching data'
				};
			} else {

				var the_issuer = req.body.issuer;

				if (the_issuer === 1) {
					data.server_coupon = JSON.parse(req.body.coupon);
				} else {
					data.server_coupon = [];
					data.shop_coupon = JSON.parse(req.body.coupon);
				}

				data.save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'error_message': 'error updating data'
						}
					} else {
						response = {
							'error_code': 0,
							'error_message': 'your data is updated !'
						}
					}
					res.status(200).json(response);
				});

			}
		});
	},
	updateCoupon: function (req, res) {
		shop_model.findById(req.body._id, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'error_message': 'error fetching data'
				};
			} else {
				var shop_coupon = data.shop_coupon;
				var server_coupon = data.server_coupon;
				var user_get_coupon = data.user_get_coupon;
				var the_issuer = req.body.the_issuer;

				if (the_issuer === 1) {
					server_coupon = JSON.parse(req.body.new_list_coupon);

					if (server_coupon.length > 0) {
						var new_server = [{
								approved: true,
								coupon: server_coupon
							}
						];
					} else {
						var new_server = [];
					}

					data.server_coupon = new_server;
					if (user_get_coupon === null || user_get_coupon.length === 0) {
						user_get_coupon = user_get_coupon || []
							user_get_coupon.push(JSON.parse(req.body.user_coupon));
					} else {
						user_get_coupon.push(JSON.parse(req.body.user_coupon));
					}
					data.user_get_coupon = user_get_coupon;
				} else {
					shop_coupon = JSON.parse(req.body.new_list_coupon);
					if (shop_coupon.length > 0) {
						var new_shop = [{
								approved: true,
								coupon: shop_coupon
							}
						]
					} else {
						var new_shop = [];
					}
					data.shop_coupon = new_shop;
					if (user_get_coupon === null || user_get_coupon.length === 0) {
						user_get_coupon = user_get_coupon || []
							user_get_coupon.push(JSON.parse(req.body.user_coupon));
					} else {
						user_get_coupon.push(JSON.parse(req.body.user_coupon));
					}
					data.user_get_coupon = user_get_coupon;
				}

				data.save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': 'error updating shop data'
						};
					} else {
						response = {
							'error_code': 0,
							'shop': data
						};
					}
				});
			}
		});

		auth_model.findById(req.body.user_id, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var total_list = data.total_list_coupon;
				if (data.total_list_coupon === null) {
					total_list = total_list || [];
					total_list.push(JSON.parse(req.body.user_coupon));
				} else {
					total_list.push(JSON.parse(req.body.user_coupon));
				}
				data.total_list_coupon = total_list;
				data.empty_slot = req.body.total_slot;
				data.save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': 'error updating user data'
						};
					} else {
						response = {
							'error_code': 0,
							'message': 'user data is updated'
						};
					}
				});
				res.status(200).json(response)
			}
		});
	},
	updateLike: function (req, res) {
		shop_model.findById(req.body._id, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var user_like_shop = data.user_like_shop;
				var new_like = {
					id: req.body.user_id,
					name: req.body.user_name
				}
				if (user_like_shop === null || user_like_shop.length === 0) {
					user_like_shop = user_like_shop || [];
					user_like_shop.push(new_like);
				} else {
					user_like_shop.push(new_like);
				}
				data.user_like_shop = user_like_shop;
				data.save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': 'error updating data'
						};
					} else {
						response = {
							'error_code': 0,
							'message': 'user like shop is updated'
						};
					}
				});

				res.status(200).json(response);
			}
		});
	},
	getByshopid: function (req, res) {
		shop_model.findById(req.body._id, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				response = {
					'error_code': 0,
					'shop': data
				};
			}
			res.status(200).json(response);
		});
	},
	getShopId: function (req, res) {
		shop_model.find({
			shopId: req.body.shopId
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				response = {
					'error_code': 0,
					'shop': data
				};
			}
			res.status(200).json(response);
		});
	},
	getShopvip: function (req, res) {
		shop_model.find({}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				if (data) {
					var vip = [];
					for (var i = 0; i < data.length; i++) {
						if (data[i].shop_rank[0].id === 1) {
							vip.push(data[i]);
						}
					}
					response = {
						'error_code': 0,
						'vip': vip
					};
				}
				res.status(200).json(response);
			}
		});
	},
	uploadImg: function (req, res, server_url) {
		shop_model.findById(req.body.shopId, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {

				var img = JSON.parse(req.body.img);
				var _album = [];

				avatar = server_url + img[0].avatar;
				cover = server_url + img[0].cover;

				img[0].album.forEach(function (item) {
					_album.push({
						url: server_url + item
					});
				});
				album = _album;

				_info = {
					shop_name: data.shop_info[0].shop_name,
					kind: data.shop_info[0].kind,
					time: data.shop_info[0].time,
					address: data.shop_info[0].address,
					service: data.shop_info[0].service,
					info: data.shop_info[0].info,
					shop_avatar: avatar,
					shop_cover: cover,
					shop_album: album
				}

				data.shop_info = _info;
				data.save(function (err) {
					if (err) {
						response = {
							'error_code': 1,
							'message': 'error updating data'
						};
					} else {
						response = {
							'error_code': 0,
							'message': 'data is updated'
						};
					}
					res.status(200).json(response);
				});

			}
		})
	},
	avatar: function (req, res, server_url) {
		shop_model.findById(req.body.shopId, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var img = JSON.parse(req.body.img);
				avatar = server_url + img[0].avatar;

				_info = {
					shop_name: data.shop_info[0].shop_name,
					kind: data.shop_info[0].kind,
					time: data.shop_info[0].time,
					address: data.shop_info[0].address,
					service: data.shop_info[0].service,
					info: data.shop_info[0].info,
					shop_avatar: avatar,
					shop_cover: data.shop_info[0].shop_cover,
					shop_album: data.shop_info[0].shop_album
				}
				data.shop_info = _info;
				data.save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': err
						};
					} else {
						response = {
							'error_code': 0,
							'message': 'update image avatar complete'
						};
					}
					res.status(200).json(response)
				})
			}
		});
	},
	cover: function (req, res, server_url) {
		shop_model.find({
			shopId: req.body.shopId
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var img = JSON.parse(req.body.img);
				cover = server_url + img[0].cover;

				_info = {
					shop_name: data[0].shop_info[0].shop_name,
					kind: data[0].shop_info[0].kind,
					time: data[0].shop_info[0].time,
					address: data[0].shop_info[0].address,
					service: data[0].shop_info[0].service,
					info: data[0].shop_info[0].info,
					shop_avatar: data[0].shop_info[0].shop_avatar,
					shop_cover: cover,
					shop_album: data[0].shop_info[0].shop_album
				}
				data[0].shop_info = _info;
				data[0].save(function (err) {
					if (err) {
						response = {
							'error_code': 1,
							'message': 'error updating data'
						};
					} else {
						response = {
							'error_code': 0,
							'message': 'data is updated'
						};
					}
					res.status(200).json(response);
				});
			}
		});
	},
	album: function (req, res, server_url) {
		shop_model.find({
			shopId: req.body.shopId
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var img = JSON.parse(req.body.img);
				var _album = [];
				img[0].album.forEach(function (item) {
					_album.push({
						url: server_url + item
					});
				});
				album = _album;

				_info = {
					shop_name: data[0].shop_info[0].shop_name,
					kind: data[0].shop_info[0].kind,
					time: data[0].shop_info[0].time,
					address: data[0].shop_info[0].address,
					service: data[0].shop_info[0].service,
					info: data[0].shop_info[0].info,
					shop_avatar: data[0].shop_info[0].shop_avatar,
					shop_cover: data[0].shop_info[0].shop_cover,
					shop_album: album
				}
				data[0].shop_info = _info;
				data[0].save(function (err) {
					if (err) {
						response = {
							'error_code': 1,
							'message': 'error updating data'
						};
					} else {
						response = {
							'error_code': 0,
							'message': 'data is updated'
						};
					}
					res.status(200).json(response);
				});
			}
		});
	},
	updateShop: function (req, res) {
		var shop = JSON.parse(req.body.shop);
		shop_model.findById(shop._id, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				data.wallet = shop.wallet;
				data.user_like_shop = shop.user_like_shop;
				data.user_get_coupon = shop.user_get_coupon;
				data.shop_status = shop.shop_status;
				data.shop_use_coupon = shop.shop_use_coupon;
				data.shop_rank = shop.shop_rank;
				data.shop_manager = shop.shop_manager;
				data.shop_info = shop.shop_info;
				data.shop_coupon = shop.shop_coupon;
				data.shop_boss = shop.shop_boss;
				data.shopId = shop.shopId;
				data.server_coupon = shop.server_coupon;
				data.expire_coupon = shop.expire_coupon;
				data.save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': err
						};
					} else {
						response = {
							'error_code': 0,
							'message': 'update shop complete'
						};
					}
					res.status(200).json(response)
				})
			}
		})
	},
	acceptCoupon: function (req, res) {
		shop_model.find({
			shopId: req.body._id
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				// console.log(req.body._id)
				data[0].shop_coupon[0].coupon.forEach(element => {
					element.approved = true;
					element.point = parseInt(req.body.point);
				});

				var the_new = [{
						approved: true,
						coupon: data[0].shop_coupon[0].coupon
					}
				];

				data[0].shop_coupon = the_new;

				data[0].save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': err
						}
					} else {
						response = {
							'error_code': 0,
							'message': 'coupon is approved'
						};
					}
					res.status(200).json(response);
				});
			}
		})
	},
	cancelCoupon: function (req, res) {
		shop_model.find({
			shopId: req.body._id
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				data[0].shop_coupon[0].coupon.forEach(element => {
					element.approved = false;
				});

				var the_new = [{
						approved: false,
						coupon: data[0].shop_coupon[0].coupon
					}
				];

				data[0].shop_coupon = the_new;

				data[0].save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': err
						}
					} else {
						response = {
							'error_code': 0,
							'message': 'coupon is cancel approved'
						};
					}
					res.status(200).json(response);
				});
			}
		})
	},
	UseruseCoupon: function (req, res) {
		shop_model.find({
			shopId: req.body._id
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var shop_use_coupon = data[0].shop_use_coupon;
				var _coupon = req.body.coupon;
				var inside = 0;
				var BreakException = {};

				try {
					if (shop_use_coupon.length > 0) {
						shop_use_coupon.forEach(element => {
							if (element.coupon._id === _coupon._id) {
								inside = 1;
								throw BreakException;
							}
						});
					}

				} catch (e) {
					if (e !== BreakException)
						throw e;
				}

				if (inside === 0) {
					var the_new = {
						_id: new mongoose.Types.ObjectId(),
						approved: 'pending',
						coupon: req.body.coupon
					}
					shop_use_coupon.push(the_new);
				}

				data[0].shop_use_coupon = shop_use_coupon;
				data[0].save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': err
						}
					} else {
						response = {
							'error_code': 0,
							'message': 'coupon is pending approved'
						};
					}
					res.status(200).json(response);
				})
			}
		})
	},
	TimeoutCoupon: function (req, res) {
		shop_model.find({
			shopId: req.body.shopid
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var shop_use_coupon = data[0].shop_use_coupon;
				if (shop_use_coupon.length > 0) {
					shop_use_coupon.forEach(element => {
						if (element.coupon._id === req.body.couponId) {
							shop_use_coupon.splice(shop_use_coupon.indexOf(element), 1);
						}
					});
				}
				data[0].shop_use_coupon = shop_use_coupon;
				data[0].save(function (err) {
					if (err) {
						response = {
							'error_code': 2,
							'message': err
						}
					} else {
						response = {
							'error_code': 0,
							'message': 'coupon remove success'
						};
					}
					res.status(200).json(response);
				})
			}
		})
	},
	RemoveCouponShopreject: function (req, res) {
		shop_model.find({
			shopId: req.body.shopid
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				if (data !== undefined && data !== null) {
					var shop_use_coupon = data[0].shop_use_coupon;
					if (shop_use_coupon.length > 0) {
						shop_use_coupon.forEach(element => {
							if (element._id.toString() === req.body.couponId) {
								shop_use_coupon.splice(shop_use_coupon.indexOf(element), 1);
							}
						});
					}
					data[0].shop_use_coupon = shop_use_coupon;
					data[0].save(function (err) {
						if (err) {
							response = {
								'error_code': 2,
								'message': err
							}
						} else {
							response = {
								'error_code': 0,
								'message': 'coupon remove success'
							};
						}
						res.status(200).json(response);
					})
				}
			}
		})
	},
	UpdateCouponshopuse: function (req, res) {
		shop_model.find({
			shopId: req.body.shopid
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				if (data.length > 0) {
					var user_get_coupon = data[0].user_get_coupon;
					var shop_use_coupon = data[0].shop_use_coupon;
					var _today = dateFormat(new Date(), "dd/mm/yyyy");
					//chuyển coupon từ user_get qua shop use
					if (user_get_coupon.length > 0) {
						user_get_coupon.forEach(element => {
							if (element._id === req.body.get_couponId) {
								user_get_coupon.splice(user_get_coupon.indexOf(element), 1);
							}
						});
					}

					if (shop_use_coupon.length > 0) {
						shop_use_coupon.forEach(element => {
							if (element._id.toString() === req.body.couponId) {

								_coupon = {
									checkId: element.coupon.checkId,
									reviewedby: element.coupon.reviewedby,
									loyal: [{
											id: element.coupon.loyal[0].name,
											name: element.coupon.loyal[0].id
										}
									],
									shop_name: element.coupon.shop_name,
									shop_cover: element.coupon.shop_cover,
									shop_avatar: element.coupon.shop_avatar,
									shop_id: element.coupon.shop_id,
									coupon_info: element.coupon.coupon_info,
									value: element.coupon.value,
									class_user: [{
											id: element.coupon.class_user[0].id,
											name: element.coupon.class_user[0].name
										}
									],
									release_day: element.coupon.release_day,
									limit_time: element.coupon.limit_time,
									time_expire: element.coupon.time_expire,
									the_issuer: [{
											id: element.coupon.the_issuer[0].id,
											name: element.coupon.the_issuer[0].name
										}
									],
									status_coupon: [{
											id: 0,
											status: "Đã sử dụng"
										}
									],
									userid_get_coupon: element.coupon.userid_get_coupon,
									time_user_get: element.coupon.time_user_get,
									time_user_use: _today,
									rating: element.coupon.rating,
									rfeedback: [{
											name: element.coupon.rfeedback[0].name,
											id: element.coupon.rfeedback[0].id
										}
									],
									feedback: element.coupon.feedback,
									approved: element.coupon.approved,
									_id: element.coupon._id
								}

								the_new = {
									_id: element._id,
									approved: true,
									coupon: _coupon
								}
								shop_use_coupon.splice(shop_use_coupon.indexOf(element), 1);
							}
						});
					}

					shop_use_coupon.push(the_new);
					data[0].user_get_coupon = user_get_coupon;
					data[0].shop_use_coupon = shop_use_coupon;
					data[0].save(function (err) {
						if (err) {
							response = {
								'error_code': 2,
								'message': err
							}
						} else {
							response = {
								'error_code': 0,
								'message': 'coupon is approved'
							};
						}
						res.status(200).json(response);
					});
				} else {
					response = {
						'error_code': 2,
						'message': 'Shop id incorrect'
					};
					res.status(200).json(response);
				}
			}
		})
	},
	UpdateCouponRating: function (req, res) {
		shop_model.find({
			shopId: req.body.shopid
		}, function (err, data) {
			if (err) {
				response = {
					'error_code': 1,
					'message': 'error fetching data'
				};
			} else {
				var shop_use_coupon = data[0].shop_use_coupon;
				// var the_new;
				if (shop_use_coupon.length > 0) {
					shop_use_coupon.forEach(element => {
						if (element.coupon._id === req.body.couponId) {
							_coupon = {
								checkId: element.coupon.checkId,
								reviewedby: element.coupon.reviewedby,
								loyal: [{
										id: element.coupon.loyal[0].name,
										name: element.coupon.loyal[0].id
									}
								],
								shop_name: element.coupon.shop_name,
								shop_cover: element.coupon.shop_cover,
								shop_avatar: element.coupon.shop_avatar,
								shop_id: element.coupon.shop_id,
								coupon_info: element.coupon.coupon_info,
								value: element.coupon.value,
								class_user: [{
										id: element.coupon.class_user[0].id,
										name: element.coupon.class_user[0].name
									}
								],
								release_day: element.coupon.release_day,
								limit_time: element.coupon.limit_time,
								time_expire: element.coupon.time_expire,
								the_issuer: [{
										id: element.coupon.the_issuer[0].id,
										name: element.coupon.the_issuer[0].name
									}
								],
								status_coupon: [{
										id: element.coupon.status_coupon[0].id,
										status: element.coupon.status_coupon[0].status
									}
								],
								userid_get_coupon: element.coupon.userid_get_coupon,
								time_user_get: element.coupon.time_user_get,
								time_user_use: element.coupon.time_user_use,
								rating: req.body.rating,
								rfeedback: [{
										name: element.coupon.rfeedback[0].name,
										id: element.coupon.rfeedback[0].id
									}
								],
								feedback: req.body.feedback,
								approved: element.coupon.approved,
								_id: element.coupon._id
							}

							the_new = {
								_id: element._id,
								approved: true,
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
						response = {
							'error_code': 2,
							'message': err
						}
					} else {
						response = {
							'error_code': 0,
							'message': 'coupon is approved'
						};

						auth_model.findOne({
							user_id: data[0].shop_boss
						}, function (err, udata) {
							if (err) {
								console.log('User feedback coupon ' + err);
							} else {
								if(udata !== null && udata !== undefined && udata.length > 0){
									let sms = 'Thành viên ' + udata.info[0].fulname + ' đã đánh giá sản phẩm của cửa hàng';
									var fcm = new FCM('AIzaSyACfkIkBA_4gv19gRhK1goKKNVMyl5-twA');
									var message = {
										to: udata.notif,
										collapse_key: 'green',

										data: {
											title: 'Thông Báo',
											message: sms,
											sound: 'default',
											vibrate: "true",
											userid: udata.user_id
										}
									};

									fcm.send(message, function (err, response) {
										if (err) {
											console.log(err);
										} else {
											// console.log('Send cho: ' +element.info[0].fulname);
										}
									});

									// var message = {
									// data: {
									// title: 'Thông Báo',
									// message: sms,
									// sound: 'default',
									// vibrate: "true",
									// userid: udata.user_id
									// },
									// notification: {
									// title: 'Thông Báo',
									// body: sms
									// },
									// token: udata.notif
									// };

									// fcmKey.send(message, function (err, response) {
									// if (err) {
									// console.log('error found', err);
									// } else {
									// // console.log('response here', response);
									// }
									// })
								}
							}
						})
					}
					res.status(200).json(response);
				});
			}
		})
	}
}
