var dateFormat = require('dateformat');
var schedule = require('node-schedule');
var express = require('express'), http = require('http');
var app = express();
// library for socket.io
var http = http.Server(app);
var io = require('socket.io')(http);
// end library


// Get model
auth_model = require('../model/auth');
shop_model = require('../model/shop');

// Sign up function
function Create_User(_user_id, _user_img, _info, _point_per_day, _point_per_today, _total_slot, _class, _download, _access_time_per_day, _point_plus, _point_bad, _total_list_coupon, _empty_slot, _use_coupon, _call_server_in_day, _role, _status) {
    if (_info !== undefined) {
        var tmp_info = JSON.parse(_info);
    } else {
        tmp_info = null;
    }

    if (_class !== undefined) {
        var tmp_class = JSON.parse(_class);
    } else {
        tmp_class = null;
    }

    if (_call_server_in_day !== undefined) {
        var tmp_call_server_in_day = JSON.parse(_call_server_in_day);
    } else {
        tmp_call_server_in_day = null;
    }

    var create = new auth_model({
        user_id: _user_id,
        user_img: _user_img,
        info: tmp_info,
        point_per_day: _point_per_day,
        point_per_today: _point_per_today,
        total_slot: _total_slot,
        user_class: tmp_class,
        download: _download,
        access_time_per_day: _access_time_per_day,
        point_plus: _point_plus,
        point_bad: _point_bad,
        total_list_coupon: [],
        empty_slot: _empty_slot,
        use_coupon: [],
        call_server_in_day: tmp_call_server_in_day,
        role: JSON.parse(_role),
        _status: JSON.parse(_status)
    });

    create.save(function (err) {
        if (err) return err;
    })
}

//conver day to int for compare
function process(x) {
    var parts = x.split("/");
    return parts[2] + parts[1] + parts[0];
}

// auto check expired coupon and alert user
function check_coupon() {
    var _today = dateFormat(new Date(), "yyyymd");
    auth_model.find({}, function (err, data) {
        if (data) {
            data.forEach(element => {
                if (element.total_list_coupon.length > 0) {
                    element.forEach(elcoupon => {
                        var _limit = process(elcoupon.limit_time);
                        var left_day = parseInt(_limit - _today);
                        // số ngày còn lại của coupon nhỏ hơn bằng 10 thì thông bao cho user
                        if (left_day <= 10) {
                            io.on('connection', function (socket) {
                                var _message = "Coupon của cửa hàng " + elcoupon.shop_name + " còn " + left_day + " nữa là hết hạn. Vui lòng sử dụng Coupon trước ngày " + elcoupon.limit_time + "."
                                var userid = elcoupon.userid_get_coupon[0].id;
                                socket.broadcast.emit('alert_coupon', userid, _message);
                            })
                        }
                    });
                }
            });
        }
    })
}

/*
schedule function
1. function remove expired automatic every midnight
*/
schedule.scheduleJob('/1* * * * *', function () {
    remove_coupon_expired();
})


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
                    Create_User(req.body.user_id, req.body.user_img, req.body.info, req.body.point_per_day, req.body.point_per_today, req.body.total_slot, req.body.user_class, req.body.download, req.body.access_time_per_day, req.body.point_plus, req.body.point_bad, req.body.total_list_coupon, req.body.empty_slot, req.body.use_coupon, req.body.call_server_in_day, req.body.role, req.body._status);
                    response = { 'error_code': 0, 'message': 'user is created !' };
                }
            }
            res.status(200).json(response);
        });
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
                    auth_model.find({ user_id: req.body.user_id }, function (err, data) {
                        if (data.length > 0) {
                            if (data[0]._status[0].id === 0) {
                                if (data[0].role[0].id !== 2) {
                                    _role = [{
                                        id: 2,
                                        name: 'Shop Owner',
                                        shop: shop_id
                                    }];
                                    data[0].role = _role;
                                    data[0].user_img = req.body.user_img;
                                    var access_time_per_day = data[0].access_time_per_day;
                                    var point = data[0].point_plus;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 50;
                                        data[0].access_time_per_day = day;
                                        data[0].point_per_today = 0;
                                    }
                                    data[0].point_plus = point;
                                    data[0].save(function (err) { });
                                } else {
                                    data[0].user_img = req.body.user_img;
                                    var access_time_per_day = data[0].access_time_per_day;
                                    var point = data[0].point_plus;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 50;
                                        data[0].access_time_per_day = day;
                                        data[0].point_per_today = 0;
                                    }
                                    data[0].point_plus = point;
                                    data[0].save(function (err) { });
                                }
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
                                the_data[0].user_img = req.body.user_img;
                                var access_time_per_day = the_data[0].access_time_per_day;
                                var point = the_data[0].point_plus;
                                var day = dateFormat(new Date(), "yyyymmdd");
                                if (access_time_per_day !== day) {
                                    point = point + 50;
                                    the_data[0].access_time_per_day = day;
                                    the_data[0].point_per_today = 0;
                                }
                                the_data[0].point_plus = point;
                                the_data[0].save(function (err) { });
                                response = { 'error_code': 0, 'auth': the_data };
                            } else {
                                response = { 'error_code': 4, 'message': 'user id incorrect' };
                            }

                        }
                        res.status(200).json(response);
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
                    auth_model.find({ user_id: req.body.user_id }, function (err, data) {
                        if (data.length > 0) {
                            if (data[0]._status[0].id === 0) {
                                //check download app first login
                                if (data[0].download === false) {
                                    data[0].download = true;
                                    data[0].save(function (err) { });
                                }
                                //end check

                                if (data[0].role[0].id !== 3) {
                                    _role = [{
                                        id: 3,
                                        name: 'Shop Manager',
                                        shop: shop_id
                                    }];
                                    data[0].role = _role;
                                    data[0].user_img = req.body.user_img;
                                    var access_time_per_day = data[0].access_time_per_day;
                                    var point = data[0].point_plus;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 50;
                                        data[0].access_time_per_day = day;
                                        data[0].point_per_today = 0;
                                    }
                                    data[0].point_plus = point;
                                    data[0].save(function (err) { });
                                } else {
                                    data[0].user_img = req.body.user_img;
                                    var access_time_per_day = data[0].access_time_per_day;
                                    var point = data[0].point_plus;
                                    var day = dateFormat(new Date(), "yyyymmdd");
                                    if (access_time_per_day !== day) {
                                        point = point + 50;
                                        data[0].access_time_per_day = day;
                                        data[0].point_per_today = 0;
                                    }
                                    data[0].point_plus = point;
                                    data[0].save(function (err) { });
                                }
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
                                //check download app first login
                                if (the_data[0].download === false) {
                                    the_data[0].download = true;
                                    the_data[0].save(function (err) { });
                                }
                                //end check

                                the_data[0].user_img = req.body.user_img;
                                var access_time_per_day = the_data[0].access_time_per_day;
                                var point = the_data[0].point_plus;
                                var day = dateFormat(new Date(), "yyyymmdd");
                                if (access_time_per_day !== day) {
                                    point = point + 50;
                                    the_data[0].access_time_per_day = day;
                                    the_data[0].point_per_today = 0;
                                }
                                the_data[0].point_plus = point;
                                the_data[0].save(function (err) { });
                                response = { 'error_code': 0, 'auth': the_data };
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
                if (data) {
                    var point_plus = data.point_plus;
                    var slot;
                    var _class;
                    var new_empty;

                    if (point_plus >= 2000) {
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
                            slot = data.total_slot
                            new_empty = data.empty_slot;
                        }
                    } else if (point_plus >= 1500) {
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
                            slot = data.total_slot
                            new_empty = data.empty_slot;
                        }
                    } else if (point_plus >= 1000) {
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
                            slot = data.total_slot
                            new_empty = data.empty_slot;
                        }
                    } else {
                        _class = data.user_class;
                        new_empty = data.empty_slot;
                    }
                    // else {
                    //     _class = [{
                    //         id: 4,
                    //         name: "Thường"
                    //     }]
                    //     slot = 5;

                    //     if (data.empty_slot === data.total_slot) {
                    //         new_empty = 5;
                    //     } else {
                    //         new_empty = 5 - data.total_slot + data.empty_slot;
                    //     }
                    // }

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
                                approved: element.approved,
                                _id: element._id
                            }
                            use_coupon.push(the_new);
                            total_list_coupon.splice(total_list_coupon.indexOf(element), 1);
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
    }
}
