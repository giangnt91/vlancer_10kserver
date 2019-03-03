var dateFormat = require('dateformat');
var schedule = require('node-schedule');


// Get model
auth_model = require('../model/auth');
shop_model = require('../model/shop');

// check loyal đầu mỗi tháng
function MonthLayol() {
    auth_model.find({ 'role.id': 0 }, function (err, data) {
        if (err) {
            console.log('MonthLayol ' + err);
        } else {
            if (data.length > 0) {

                var day = dateFormat(new Date(), "yyyymmdd");
                var d = new Date();
                var _premonth = d.getMonth();
                data.forEach(element => {
					
                    if (element.loyal[0].prePoint >= 20) {
                        let _tmp = {
                            today: day,
                            preMonth: element.loyal[0].preMonth,
                            prePoint: element.loyal[0].prePoint,
                            Month: _premonth + 1,
                            Point: 0,
                            Loyal: 1,
                            Expired: 1
                        }
						
                        element.loyal = [_tmp];
                        element.save(function (err) {
                            if (err) {
                                console.log(err);
                            }
                        })
                    } else {
                        if (element.loyal[0].Expired === 1) {
                            let _tmp = {
                                today: day,
                                preMonth: element.loyal[0].preMonth,
                                prePoint: element.loyal[0].prePoint,
                                Month: _premonth + 1,
                                Point: 0,
                                Loyal: 1,
                                Expired: 0
                            }

							element.loyal = [_tmp];
                            element.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            })
                        } else {
                            let _tmp = {
                                today: day,
                                preMonth: element.loyal[0].preMonth,
                                prePoint: element.loyal[0].prePoint,
                                Month: _premonth + 1,
                                Point: 0,
                                Loyal: 0,
                                Expired: 0
                            }

							element.loyal = [_tmp];
                            element.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            })
                        }
                    }
                });
            }
        }
    })
}

// chạy mỗi đầu tháng cho loyal
schedule.scheduleJob('0 0 1 * *', function () {
    MonthLayol();
});

// schedule.scheduleJob('*/2 * * * * *', function () {
    // MonthLayol();
// });

// Api
module.exports = {
    // Sign up
    signUp: function (req, res) {
        auth_model.find({ user_id: req.body.user_id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data !' };
            } else {
                if (data.length > 0) {
                    response = { 'error_code': 2, 'message': 'username already exists, retry with another username !' }
                } else {
                    _access = [{
                        id: 0,
                        value: '2018'
                    }]
                    var day = dateFormat(new Date(), "yyyymmdd");
					let dayreg = dateFormat(new Date(), "dd/mm/yyyy");
					
                    var d = new Date();
					year = d.getFullYear();
					month = d.getMonth() + 1;
					dt = d.getDate() + 1;
					
                    var _premonth = d.getMonth();
					let isoday = year + '-' + month + '-' + dt;
					
                    _loyal = [{
                        today: day,
                        preMonth: _premonth,
                        prePoint: 0,
                        Month: _premonth + 1,
                        Point: 1,
                        Loyal: 0,
                        Expired: 0
                    }]

                    var new_auth = new auth_model({
                        user_id: req.body.user_id,
                        user_img: req.body.user_img,
                        info: JSON.parse(req.body.info),
                        point_per_day: req.body.point_per_day,
                        point_per_today: req.body.point_per_today,
                        total_slot: req.body.total_slot,
                        user_class: JSON.parse(req.body.user_class),
                        download: req.body.download,
                        access_time_per_day: _access,
                        point_plus: req.body.point_plus,
                        point_bad: req.body.point_bad,
                        total_list_coupon: [],
                        empty_slot: req.body.empty_slot,
                        use_coupon: req.body.use_coupon,
                        call_server_in_day: req.body.call_server_in_day,
                        role: JSON.parse(req.body.role),
                        notif: null,
                        loyal: _loyal,
						regday: dayreg,
						regdayiso: isoday,
						access_token: req.body.access_token,
                        _status: JSON.parse(req.body._status),
						likecount: 0,
                        commentcount: 0,
                        gifts: []
                    });

                    new_auth.save(function (err) {
                        if (err) {
                            response = { 'error_code': 1, 'message': 'error fetching data' };
                        } else {
                            response = { 'error_code': 0, 'message': 'user is created !' };
                        }
                        res.status(200).json(response);
                    })
                }
            }
        });
    },

    CheckinLoyal: function (req, res) {
        auth_model.findById({ _id: req.body._id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data !' };
            } else {
                var day = dateFormat(new Date(), "yyyymmdd");
                let _tmp;
                let _tmp_loyal;

                if (day !== data.loyal[0].today) {

                    if (data.loyal[0].Point + 1 >= 20) {
                        if (data.loyal[0].Loyal === 0) {
                            _tmp_loyal = 1;
                        } else {
                            _tmp_loyal = data.loyal[0].Loyal;
                        }
                    } else {
                        _tmp_loyal = data.loyal[0].Loyal;
                    }

                    _tmp = {
                        today: day,
                        preMonth: data.loyal[0].preMonth,
                        prePoint: data.loyal[0].prePoint,
                        Month: data.loyal[0].Month,
                        Point: data.loyal[0].Point + 1,
                        Loyal: _tmp_loyal,
                        Expired: data.loyal[0].Expired
                    }

                    data.loyal = [_tmp];
                    data.save(function (err) {
                        if (err) {
                            response = { 'error_code': 1, 'message': 'error fetching data' };
                        } else {
                            response = { 'error_code': 0, 'auth': data }
                            res.status(200).json(response);
                        }
                    })
                }
            }
        })
    },
	// Sign out
	signOut: function(req, res){
		auth_model.findById( req.body._id , function(err, data){
			if(err){
				response = { 'error_code': 1, 'message': 'error fetching data !' };
				res.status(200).json(response);
			}else{
				data.notif = '';
				data.save(function(err){
					if(err){
						console.log('Sign out : ' + err);
						response = { 'error_code': 1, 'message': 'error fetching data !' };
					}else{
						response = {'error_code' : 0, 'message' : ' User signOut Success'};
						res.status(200).json(response);
					}
				})
			}
		})
	},
	
	//get Token
	authToken: function(req, res){
		auth_model.findById( '5c2d8264bd281e040900a0e0', function(err, data){
			if(err){
				console.log('get Token is erorr: ' +err);
			}else{
				response = {'error_code': 0, 'Token': data.access_token};
				res.status(200).json(response);
			}
		})
	},
	
    // Sign in
    signIn: function (req, res) {
        shop_model.find({ shop_boss: req.body.user_id }, function (err, shopdata) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data !' };
            }
            else {
                if (shopdata.length > 0) {
                    var shop_id = shopdata[0].shopId;
                    var shop_name = shopdata[0].shop_info[0].shop_name;
                    auth_model.find({ user_id: req.body.user_id }, function (err, data) {
                        if (data.length > 0) {
                            if (data[0]._status[0].id === 0) {
                                // if (data[0].role[0].id !== 2) {
                                    _role = [{
                                        id: 2,
                                        name: 'Shop Owner',
                                        shop: shop_id,
                                        shop_name: shop_name
                                    }];
                                    data[0].role = _role;
                                    data[0].user_img = req.body.user_img;
                                    var access_time_per_day = data[0].access_time_per_day[0].value;
                                    var point = data[0].point_plus;
									var point_today = 1;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 1;
                                        new_access_time = [{
                                            id: 1,
                                            value: day
                                        }]
                                        data[0].access_time_per_day = new_access_time;
                                        data[0].point_per_today = point_today;
                                    } else {
                                        new_access_time = [{
                                            id: 0,
                                            value: day
                                        }]
                                        data[0].access_time_per_day = new_access_time;
                                    }
                                    data[0].point_plus = point;
                                    data[0].save(function (err, user) {
										if(err){
											response = { 'error_code': 1, 'message': 'error fetching data' };
										}else{
											response = { 'error_code': 0, 'auth': [user] };
										}
										res.status(200).json(response);
									});
                                // } else {
                                    // data[0].user_img = req.body.user_img;
                                    // var access_time_per_day = data[0].access_time_per_day[0].value;
                                    // var point = data[0].point_plus;
									// var point_today = 50;
                                    // var day = dateFormat(new Date(), "yyyymmdd");
                                    // if (access_time_per_day !== day) {
                                        // point = point + 50;
                                        // new_access_time = [{
                                            // id: 1,
                                            // value: day
                                        // }]
                                        // data[0].access_time_per_day = new_access_time;
                                        // data[0].point_per_today = point_today;
                                    // } else {
                                        // new_access_time = [{
                                            // id: 0,
                                            // value: day
                                        // }]
                                        // data[0].access_time_per_day = new_access_time;
                                    // }
                                    // data[0].point_plus = point;
                                    // data[0].save(function (err) { });
                                // }                             
                            } else {
                                response = { 'error_code': 5, 'message': 'your account is block' };
								res.status(200).json(response);
                            }
                        } else {
                            response = { 'error_code': 2, 'message': 'user id incorrect' };
							res.status(200).json(response);
                        }
                        
                    });
                } else {
                    auth_model.find({ user_id: req.body.user_id }, function (err, the_data) {
                        if (err) {
                            response = { 'error_code': 1, 'message': 'error fetching data !' };
                        }
                        else {
                            if (the_data.length > 0) {
                                if (the_data[0]._status[0].id === 0) {
                                    if (the_data[0].role[0].id === 2) {
                                        _role = [{
                                            id: 0,
                                            name: 'Thường',
                                        }];
                                        the_data[0].role = _role;
                                    }
                                    the_data[0].user_img = req.body.user_img;
                                    var access_time_per_day = the_data[0].access_time_per_day[0].value;
                                    var point = the_data[0].point_plus;
									var point_today = 1;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 1;
                                        new_access_time = [{
                                            id: 1,
                                            value: day
                                        }]
                                        the_data[0].access_time_per_day = new_access_time;
                                        the_data[0].point_per_today = point_today;
                                    } else {
                                        new_access_time = [{
                                            id: 0,
                                            value: day
                                        }]
                                        the_data[0].access_time_per_day = new_access_time;
                                    }
                                    the_data[0].point_plus = point;
                                    the_data[0].save(function (err, user) {
		
										if(err){
											response = { 'error_code': 1, 'message': 'error fetching data' };
										}else{
											response = { 'error_code': 0, 'auth': [user] };
										}
										res.status(200).json(response);

									});
                                 
                                } else {
                                    response = { 'error_code': 5, 'message': 'your account is block' };
									res.status(200).json(response);
                                }
                            } else {
                                response = { 'error_code': 2, 'message': 'user id incorrect' };
								res.status(200).json(response);
                            }
                        }
                        
                    });
                }
            }
        });
    },

    // Sign in Mobile
    Mobile: function (req, res) {
        shop_model.find({ shop_manager: { $elemMatch: { text: req.body.user_id } } }, function (err, Shopdata) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data !' };
            } else {
                if (Shopdata.length > 0) {
                    var shop_id = Shopdata[0].shopId;
                    var shop_name = Shopdata[0].shop_info[0].shop_name;
                    auth_model.find({ user_id: req.body.user_id }, function (err, data) {
                        if (data.length > 0) {
                            if (data[0]._status[0].id === 0) {
                                //check download app first login
                                if (data[0].download === false) {
                                    data[0].download = true;
                                    data[0].save(function (err) { });
                                }
                                //end check

                                // if (data[0].role[0].id !== 3) {
                                    _role = [{
                                        id: 3,
                                        name: 'Shop Manager',
                                        shop: shop_id,
                                        shop_name: shop_name
                                    }];
                                    data[0].role = _role;
                                    data[0].user_img = req.body.user_img;
                                    var access_time_per_day = data[0].access_time_per_day[0].value;
                                    var point = data[0].point_plus;
									var point_today = 1;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 1;
                                        new_access_time = [{
                                            id: 1,
                                            value: day
                                        }]
                                        data[0].access_time_per_day = new_access_time;
                                        data[0].point_per_today = point_today;
                                    } else {
                                        new_access_time = [{
                                            id: 0,
                                            value: day
                                        }]
                                        data[0].access_time_per_day = new_access_time;
                                    }
                                    data[0].point_plus = point;
                                    data[0].save(function (err) { });
                                // } else {
                                    // data[0].user_img = req.body.user_img;
                                    // var access_time_per_day = data[0].access_time_per_day[0].value;
                                    // var point = data[0].point_plus;
									// var point_today = 50;
                                    // var day = dateFormat(new Date(), "yyyymmdd");

                                    // if (access_time_per_day !== day) {
                                        // point = point + 50;
                                        // new_access_time = [{
                                            // id: 1,
                                            // value: day
                                        // }]
                                        // data[0].access_time_per_day = new_access_time;
                                        // data[0].point_per_today = point_today;
                                    // } else {
                                        // new_access_time = [{
                                            // id: 0,
                                            // value: day
                                        // }]
                                        // data[0].access_time_per_day = new_access_time;
                                    // }
                                    // data[0].point_plus = point;
                                    // data[0].save(function (err) { });
                                // }
                                response = { 'error_code': 0, 'auth': data };
                            } else {
                                response = { 'error_code': 5, 'message': 'your account is block' };
                            }
                        } else {
                            response = { 'error_code': 2, 'message': 'user id incorrect' };
                        }
                        res.status(200).json(response);
                    });
                } else {
                    auth_model.find({ user_id: req.body.user_id }, function (err, the_data) {
                        if (err) {
                            response = { 'error_code': 1, 'message': 'error fetching data !' };
                        }
                        else {
                            if (the_data.length > 0) {
                                if (the_data[0]._status[0].id === 0) {
                                    if (the_data[0].role[0].id === 3) {
                                        _role = [{
                                            id: 0,
                                            name: 'Thường',
                                        }];
                                        the_data[0].role = _role;
                                    }

                                    //check download app first login
                                    if (the_data[0].download === false) {
                                        the_data[0].download = true;
                                        the_data[0].save(function (err) { });
                                    }
                                    //end check

                                    the_data[0].user_img = req.body.user_img;
                                    var access_time_per_day = the_data[0].access_time_per_day[0].value;
                                    var point = the_data[0].point_plus;
									var point_today = 1;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 1;
                                        new_access_time = [{
                                            id: 1,
                                            value: day
                                        }]
                                        the_data[0].access_time_per_day = new_access_time;
                                        the_data[0].point_per_today = point_today;
                                    } else {
                                        new_access_time = [{
                                            id: 0,
                                            value: day
                                        }]
                                        the_data[0].access_time_per_day = new_access_time;
                                    }
                                    the_data[0].point_plus = point;
                                    the_data[0].save(function (err) { });
                                    response = { 'error_code': 0, 'auth': the_data };
                                } else {
                                    response = { 'error_code': 5, 'message': 'your account is block' };
                                }
                            } else {
                                response = { 'error_code': 2, 'message': 'user id incorrect' };
                            }
                        }
                        res.status(200).json(response);
                    });
                }
            }
        })
    },

    RemoveCoupon: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                data.total_list_coupon.forEach(element => {
                    if (element._id === req.body.couponId) {
                        data.total_list_coupon.splice(data.total_list_coupon.indexOf(element), 1);
                    }
                });
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 3, 'message': 'error update data' };
                    } else {
                        response = { 'error_code': 0, 'message': 'Update coupon user success' };
                    }
                    res.status(200).json(response);
                })
            }
        })
    },

    UpdateuserNotif: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                if (data) {
					if(req.body.notifId !== null && req.body.notifId !== undefined && req.body.notifId !== ''){
						data.notif = req.body.notifId;
						data.save(function (err) {
							if (err) {
								response = { 'error_code': 3, 'message': 'error update data' };
							} else {
								response = { 'error_code': 0, 'message': 'Update NotifId success' };
							}
							res.status(200).json(response);
						})
					}
                    
                }else{
					response = { 'error_code': 2, 'message': 'User id not found !' };
					res.status(200).json(response);
				}
            }
        })
    },

    //update profile info
    update: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                var info = {
                    fulname: req.body.fulname,
                    email: req.body.email,
                    sex: req.body.sex,
                    mobile: req.body.mobile,
                    work: req.body.work,
                    bith_day: req.body.bithday,
                    full_update: req.body.full_update
                }
                data.info = info;
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 2, 'message': 'error updating user info' };
                    } else {
                        response = { 'error_code': 0, 'message': 'user info updated' };
                    }
                    res.status(200).json(response);
                });
            }
        });
    },

    update_yourname: function (req, res) {
        auth_model.find({ user_id: req.body.userid }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                var info = {
                    fulname: req.body.fulname,
                    email: data[0].info[0].email,
                    sex: data[0].info[0].sex,
                    mobile: data[0].info[0].mobile,
                    work: data[0].info[0].work,
                    bith_day: data[0].info[0].bith_day,
                    full_update: data[0].info[0].full_update
                }
                data[0].info = info;
                data[0].save(function (err) {
                    if (err) {
                        response = { 'error_code': 2, 'message': 'error updating user info' };
                    } else {
                        response = { 'error_code': 0, 'message': 'user info updated' };
                    }
                    res.status(200).json(response);
                });
            }
        });
    },

    // plus point for user after reaction
    plus: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                if (data !== null) {
                    if (req.body.action_point === 0) {
                        if (data.point_per_today < data.point_per_day || data.point_per_day === 0) {
                            data.point_per_today = data.point_per_today + req.body.point;
                            data.point_plus = data.point_plus + req.body.point;
                            data.save(function (err) {
                                if (err) {
                                    response = { 'error_code': 2, 'message': 'save data error' };
                                } else {
                                    response = { 'error_code': 0, 'message': 'your point is updated' };
                                }
                                res.status(200).json(response);
                            });
                        }
                    } else {
                        data.point_plus = data.point_plus + req.body.point;
                        data.save(function (err) {
                            if (err) {
                                response = { 'error_code': 2, 'message': 'save data error' };
                            } else {
                                response = { 'error_code': 0, 'message': 'your point is updated' };
                            }
                            res.status(200).json(response);
                        });
                    }
                }
            }
        });
    },

    // update class for user
    updateClass: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                if (data !== null) {
                    var point_plus = data.point_plus;
                    var bach_kim = 2000;
                    var vang = 1500;
                    var bac = 1000;
                    var slot;
                    var _class;
                    var new_empty;

                    if (point_plus >= bach_kim) {
                        if (data.user_class[0].id !== 1) {
                            _class = [{
                                id: 1,
                                name: "Bạch Kim"
                            }]
                            slot = 15;

                            if (data.empty_slot === data.total_slot) {
                                new_empty = 15;
                            } else {
                                new_empty = 15 - data.total_slot + data.empty_slot;
                            }
                        } else {
                            _class = data.user_class;
                            slot = data.total_slot;
                            new_empty = data.empty_slot;
                        }
                    } else if (point_plus >= vang) {
                        if (data.user_class[0].id !== 2) {
                            _class = [{
                                id: 2,
                                name: "Vàng"
                            }]
                            slot = 12;

                            if (data.empty_slot === data.total_slot) {
                                new_empty = 12;
                            } else {
                                new_empty = 12 - data.total_slot + data.empty_slot;
                            }
                        } else {
                            _class = data.user_class;
                            slot = data.total_slot;
                            new_empty = data.empty_slot;
                        }
                    } else if (point_plus >= bac) {
                        if (data.user_class[0].id !== 3) {
                            _class = [{
                                id: 3,
                                name: "Bạc"
                            }]
                            slot = 10;

                            if (data.empty_slot === data.total_slot) {
                                new_empty = 10;
                            } else {
                                new_empty = 10 - data.total_slot + data.empty_slot;
                            }
                        } else {
                            _class = data.user_class;
                            slot = data.total_slot;
                            new_empty = data.empty_slot;
                        }
                    } else {
                        _class = data.user_class;
                        slot = data.total_slot;
                        new_empty = data.empty_slot;
                    }


                    data.user_class = _class;
                    data.total_slot = slot;
                    data.empty_slot = new_empty;

                    data.save(function (err) {
                        if (err) {
                            response = { 'error_code': 2, 'message': 'error updating class for user' };
                        } else {
                            response = { 'error_code': 0, 'message': 'your class is updated' };
                        }
                        res.status(200).json(response);
                    })
                }

            }
        });
    },
    updatePointbad: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                var point_bad = data.point_bad;
                point_bad = point_bad + 1;
                data.point_bad = point_bad;
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 2, 'message': 'error updating point_bad for user' };
                    } else {
                        response = { 'error_code': 0, 'message': 'your data is updated' };
                    }
                    res.status(200).json(response);
                })
            }
        });
    },
	AcessToken: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                data.access_token = req.body.access_token;
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 2, 'message': 'error updating access_token for user' };
                    } else {
                        response = { 'error_code': 0, 'auth': data };
                    }
                    res.status(200).json(response);
                })
            }
        });
    },
	Minuspoints: function(req, res){
		auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                data.point_plus = req.body.point;
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 2, 'message': 'error updating point_plus for user' };
                    } else {
                        response = { 'error_code': 0, 'auth': data };
                    }
                    res.status(200).json(response);
                })
            }
        });
	},
    getAlluser: function (req, res) {
        auth_model.find({}, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, 'users': data };
            }
            res.status(200).json(response);
        });
    },
    blockUser: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                _status = {
                    id: 1,
                    name: "Block"
                }
                data._status = _status;
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 3, 'message': 'error update data' };
                    } else {
                        response = { 'error_code': 0, 'message': 'block user success' };
                    }
                })
            }
            res.status(200).json(response);
        });
    },
    delUser: function (req, res) {
        auth_model.findOneAndRemove({ _id: req.body._id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { "error_code": 0, "message": "User is deleted" };
                res.status(200).json(response);
            }
        });
    },
    activeUser: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                _status = {
                    id: 0,
                    name: "Active"
                }
                data._status = _status;
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 3, 'message': 'error update data' };
                    } else {
                        response = { 'error_code': 0, 'message': 'block user success' };
                    }
                })
            }
            res.status(200).json(response);
        });
    },
	waitShopApproved: function(req, res){
		auth_model.findById(req.body._id, function(err, data){
			if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                if (data.total_list_coupon.length > 0) {
					var total_list_coupon = data.total_list_coupon;
					
                    total_list_coupon.forEach(element => {
                        if (element._id === req.body.couponId) {
							the_new = {
								checkId: element.checkId,
								reviewedby: element.reviewedby,
								loyal:[
									{
                                        id: element.loyal[0].name,
                                        name: element.loyal[0].id
                                    }
								],
                                shop_name: element.shop_name,
                                shop_cover: element.shop_cover,
                                shop_avatar: element.shop_avatar,
                                shop_id: element.shop_id,
                                coupon_info: element.coupon_info,
                                value: element.value,
                                class_user: [
                                    {
                                        id: element.class_user[0].id,
                                        name: element.class_user[0].name
                                    }
                                ],
                                release_day: element.release_day,
								limit_time: element.limit_time,
                                time_expire: element.time_expire,
                                the_issuer: [
                                    {
                                        id: element.the_issuer[0].id,
                                        name: element.the_issuer[0].name
                                    }
                                ],
                                status_coupon: [
                                    {
                                        id: 1,
										status: "Còn hạn và chưa sử dụng"
                                    }
                                ],
                                userid_get_coupon: element.userid_get_coupon,
                                time_user_get: element.time_user_get,
                                time_user_use: element.time_user_use,
                                rating: element.rating,
                                rfeedback: [
                                    {
                                        name: element.rfeedback[0].name,
                                        id: element.rfeedback[0].id
                                    }
                                ],
                                feedback: element.feedback,
                                approved: "pending",
                                _id: element._id
                            }
							total_list_coupon.splice(total_list_coupon.indexOf(element), 1);
							total_list_coupon.push(the_new);
						}
					});
					
					data.total_list_coupon = total_list_coupon;
					data.save(function(err){
						if (err) {
							response = { 'error_code': 3, 'message': 'error update data' };
						} else {
							response = { 'error_code': 0, 'message': 'Update coupon pending success' };
						}
						res.status(200).json(response);
					})
				}
			}
		})
	},
	timeOutUser: function(req, res){
		auth_model.findById(req.body._id, function(err, data){
			if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                if (data.total_list_coupon.length > 0) {
					var total_list_coupon = data.total_list_coupon;
					
                    total_list_coupon.forEach(element => {
                        if (element._id === req.body.couponId) {
							the_new = {
								checkId: element.checkId,
								reviewedby: element.reviewedby,
								loyal:[
									{
                                        id: element.loyal[0].name,
                                        name: element.loyal[0].id
                                    }
								],
                                shop_name: element.shop_name,
                                shop_cover: element.shop_cover,
                                shop_avatar: element.shop_avatar,
                                shop_id: element.shop_id,
                                coupon_info: element.coupon_info,
                                value: element.value,
                                class_user: [
                                    {
                                        id: element.class_user[0].id,
                                        name: element.class_user[0].name
                                    }
                                ],
                                release_day: element.release_day,
								limit_time: element.limit_time,
                                time_expire: element.time_expire,
                                the_issuer: [
                                    {
                                        id: element.the_issuer[0].id,
                                        name: element.the_issuer[0].name
                                    }
                                ],
                                status_coupon: [
                                    {
                                        id: 1,
										status: "Còn hạn và chưa sử dụng"
                                    }
                                ],
                                userid_get_coupon: element.userid_get_coupon,
                                time_user_get: element.time_user_get,
                                time_user_use: element.time_user_use,
                                rating: element.rating,
                                rfeedback: [
                                    {
                                        name: element.rfeedback[0].name,
                                        id: element.rfeedback[0].id
                                    }
                                ],
                                feedback: element.feedback,
                                approved: true,
                                _id: element._id
                            }
							total_list_coupon.splice(total_list_coupon.indexOf(element), 1);
							total_list_coupon.push(the_new);
						}
					});
					
					data.total_list_coupon = total_list_coupon;
					data.save(function(err){
						if (err) {
							response = { 'error_code': 3, 'message': 'error update data' };
						} else {
							response = { 'error_code': 0, 'message': 'Update coupon timeout success' };
						}
						res.status(200).json(response);
					})
				}
			}
		})
	},
    CouponUsefeed: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                var total_list_coupon = data.total_list_coupon;
                var use_coupon = data.use_coupon;
                var _today = dateFormat(new Date(), "dd/mm/yyyy");

                //chuyển coupon từ total_list_coupon qua user use
                if (total_list_coupon.length > 0) {
                    total_list_coupon.forEach(element => {
                        if (element._id === req.body.couponId) {
                            the_new = {
								checkId: element.checkId,
								reviewedby: element.reviewedby,
								loyal:[
									{
                                        id: element.loyal[0].name,
                                        name: element.loyal[0].id
                                    }
								],
                                shop_name: element.shop_name,
                                shop_cover: element.shop_cover,
                                shop_avatar: element.shop_avatar,
                                shop_id: element.shop_id,
                                coupon_info: element.coupon_info,
                                value: element.value,
                                class_user: [
                                    {
                                        id: element.class_user[0].id,
                                        name: element.class_user[0].name
                                    }
                                ],
                                release_day: element.release_day,
								limit_time: element.limit_time,
                                time_expire: element.time_expire,
                                the_issuer: [
                                    {
                                        id: element.the_issuer[0].id,
                                        name: element.the_issuer[0].name
                                    }
                                ],
                                status_coupon: [
                                    {
                                        id: 0,
                                        status: "Đã sử dụng"
                                    }
                                ],
                                userid_get_coupon: element.userid_get_coupon,
                                time_user_get: element.time_user_get,
                                time_user_use: _today,
                                rating: req.body.rating,
                                rfeedback: [
                                    {
                                        name: element.rfeedback[0].name,
                                        id: element.rfeedback[0].id
                                    }
                                ],
                                feedback: req.body.feedback,
                                approved: true,
                                _id: element._id
                            }
							total_list_coupon.splice(total_list_coupon.indexOf(element), 1);
                            use_coupon.push(the_new); 
                        }
                    });
                }

                data.use_coupon = use_coupon;
                data.empty_slot = data.total_slot - total_list_coupon.length;
                data.total_list_coupon = total_list_coupon;

                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 3, 'message': 'error update data' };
                    } else {
                        response = { 'error_code': 0, 'message': 'Update coupon user success' };
                    }
                    res.status(200).json(response);
                })
            }
        });
    },
    UpdateAfterUse: function (req, res) {
        auth_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                var use_coupon = data.use_coupon;
                use_coupon.forEach(element => {
                    if (element._id === req.body.couponId) {
                        the_new = {
							checkId: element.checkId,
							reviewedby: element.reviewedby,
							loyal:[
									{
                                        id: element.loyal[0].name,
                                        name: element.loyal[0].id
                                    }
								],
                            shop_name: element.shop_name,
                            shop_cover: element.shop_cover,
                            shop_avatar: element.shop_avatar,
                            shop_id: element.shop_id,
                            coupon_info: element.coupon_info,
                            value: element.value,
                            class_user: [
                                {
                                    id: element.class_user[0].id,
                                    name: element.class_user[0].name
                                }
                            ],
                            release_day: element.release_day,
							limit_time: element.limit_time,
                            time_expire: element.time_expire,
                            the_issuer: [
                                {
                                    id: element.the_issuer[0].id,
                                    name: element.the_issuer[0].name
                                }
                            ],
                            status_coupon: [
                                {
                                    id: 0,
                                    status: "Đã sử dụng"
                                }
                            ],
                            userid_get_coupon: element.userid_get_coupon,
                            time_user_get: element.time_user_get,
                            time_user_use: element.time_user_use,
                            rating: req.body.rating,
                            rfeedback: [
                                {
                                    name: element.rfeedback[0].name,
                                    id: element.rfeedback[0].id
                                }
                            ],
                            feedback: req.body.feedback,
                            approved: element.approved,
                            _id: element._id
                        }
                        use_coupon.splice(use_coupon.indexOf(element), 1);
                        use_coupon.push(the_new);
                    }
                });
                data.use_coupon = use_coupon;
                data.save(function (err) {
                    if (err) {
                        response = { 'error_code': 3, 'message': 'error update data' };
                    } else {
                        response = { 'error_code': 0, 'message': 'Update coupon user success' };
                    }
                    res.status(200).json(response);
                })
            }
        })
    }
}
