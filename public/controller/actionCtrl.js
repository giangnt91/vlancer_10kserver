var dateFormat = require('dateformat');
var device = require('express-device');

// get model
var action_model = require('../model/action');
var auth_model = require('../model/auth');
var social_model = require('../model/reaction');
var auth;

// create action
function create_action(_kind, _url, _id, _shop_id, _action_user, _action_expireday, _action_likemax, _action_commentmax) {
	var day = dateFormat(new Date(), "dd/mm/yyyy");
    // if (_action_user !== undefined) {
    //     var tmp_action_user = JSON.parse(_action_user);
    // } else {
    //     tmp_action_user = null;
    // }
	var _status = {
			id: 1,
			name: "Hoạt Động"
		}

    var action = new action_model({
        action_kind: _kind,
        action_url: _url,
        action_id: _id,
        action_shop_id: _shop_id,
        action_user: _action_user,
		action_releaseday: day,
		action_expiredday: _action_expireday,
		action_likemax: parseInt(_action_likemax),
		action_like: 0,
		action_commentmax: parseInt(_action_commentmax),
		action_comment: 0,
		action_status: _status
    });

    action.save(function (err) {
        if (err) {
            response = { 'error_code': 2, 'message': 'error create new action' };
        } else {
            response = { 'error_code': 0, 'message': 'new action is created !' };
        }
        return response;
    });
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

// api
module.exports = {
    create: function (req, res) {
        action_model.find({ action_id: req.body.action_id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error_fetching data' };
            } else {
                if (data.length > 0) {
                    response = { 'error_code': 2, 'message': 'ID tác vụ đã tồn tại vui lòng nhập ID khác.' };
                } else {
                    create_action(req.body.action_kind, req.body.action_url, req.body.action_id, req.body.action_shop_id, req.body.action_user, req.body.action_expiredday, req.body.action_likemax, req.body.action_commentmax);
                    response = { 'error_code': 0, 'message': 'new action is created !' };
                }
            }
            res.status(200).json(response);
        })
    },
    update_action_user: function (req, res) {
        action_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error_fetching data' };
            } else {
                if (data) {
                    var day = dateFormat(new Date(), "yyyymmdd");
                    var action_user = data.action_user;
                    action_user.push({
                        user_id: auth.user_id,
                        day_access: day
                    })
                    data.action_user = action_user;
                    data.save(function (err) { });
                    response = { 'error_code': 0, 'message': 'update action_user complete' };
                }
                res.status(200).json(response);
            }
        });
    },
    get_action_for_user_per_day: function (req, res) {

        auth_model.find({ user_id: req.body.user_id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                auth = data[0];
                var day = dateFormat(new Date(), "yyyymmdd");
                if (data[0].call_server_in_day === null || data[0].call_server_in_day[0].day !== day) {

                    //save today to auth
                    var new_call = {
                        id: 1,
                        day: day
                    }
                    data[0].call_server_in_day = new_call;
                    // data[0].point_per_today = 0;
                    data[0].save(function (err) {
                        if (err) {
                            response = { 'error_code': 2, 'message': 'error updating data' };
                        }
                    })

                    response = { 'error_code': 0, 'message': 'goi server lan dau' }
                } else {
                    var new_call = {
                        id: 2,
                        day: day
                    }
                    data[0].call_server_in_day = new_call;
                    data[0].save(function (err) {
                        if (err) {
                            response = { 'error_code': 2, 'message': 'error updating data' };
                        }
                    })
                    response = { 'error_code': 0, 'message': 'goi server lan 2 tro len' }
                }
            }
            // res.status(200).json(response);
        });

        action_model.find({}, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                if (auth) {
                    var day = dateFormat(new Date(), "yyyymmdd");
                    var list_action_per_day;
                    var tmp_list = [];
                    var point = 0;
                    var inside;
                    var BreakException = {};

                    if (auth.call_server_in_day[0].id === 1) {
                        if (data !== null) {
                            for (var i = 0; i < data.length; i++) {
                                if (data[i].action_user.length === 0) {
                                    tmp_list.push(data[i]);
                                } else {
                                    try {
                                        data[i].action_user.forEach(function (item) {
                                            if (item.user_id === auth.user_id) {
                                                inside = 1;
                                                throw BreakException;
                                            }
                                        });

                                        if (inside === 0) {
                                            tmp_list.push(data[i]);
                                        }

                                        inside = 0;
                                    } catch (e) {
                                        if (e !== BreakException) throw e;
                                    }
                                }
                            }

                            // get random 2 post
                            if (tmp_list.length >= 3) {
                                list_action_per_day = getRandom(tmp_list, 3);
                            } else {
                                list_action_per_day = tmp_list;
                            }

                            // list_action_per_day.push(page);

                            // save total point per day
                            for (var i = 0; i < list_action_per_day.length; i++) {
                                point = point + 1000;
                            }
                            auth.point_per_day = point;
                            auth.save(function (err) {
                                if (err) {
                                    response = { 'error_code': 2, 'message': 'error updating data' };
                                }
                            });
                        }
                        response = { 'error_code': 0, 'list_action_per_day': list_action_per_day, 'device': req.device.type }
                    } else {
                        if (auth.point_per_today === 0) {
                            if (data !== null) {
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i].action_user.length === 0) {
                                        tmp_list.push(data[i]);
                                    } else {
                                        try {
                                            data[i].action_user.forEach(function (item) {
                                                if (item.user_id === auth.user_id) {
                                                    inside = 1;
                                                    throw BreakException;
                                                }
                                            });

                                            if (inside === 0) {
                                                tmp_list.push(data[i]);
                                            }

                                            inside = 0;
                                        } catch (e) {
                                            if (e !== BreakException) throw e;
                                        }
                                    }
                                }

                                // get random 3 post
                                if (tmp_list.length >= 3) {
                                    list_action_per_day = getRandom(tmp_list, 3);
                                } else {
                                    list_action_per_day = tmp_list;
                                }
                            }
                        } else {
                            var rest_point = auth.point_per_day - auth.point_per_today;
                            if (rest_point > 0) {
                                if (rest_point <= 1000) {
                                    if (data !== null) {
                                        for (var i = 0; i < data.length; i++) {
                                            if (data[i].action_user.length === 0) {
                                                tmp_list.push(data[i]);
                                            } else {
                                                try {
                                                    data[i].action_user.forEach(function (item) {
                                                        if (item.user_id === auth.user_id) {
                                                            inside = 1;
                                                            throw BreakException;
                                                        }
                                                    });

                                                    if (inside === 0) {
                                                        tmp_list.push(data[i]);
                                                    }

                                                    inside = 0;
                                                } catch (e) {
                                                    if (e !== BreakException) throw e;
                                                }
                                            }
                                        }

                                    }
                                    if (tmp_list.length >= 1) {
                                        list_action_per_day = getRandom(tmp_list, 1);
                                    } else {
                                        list_action_per_day = tmp_list;
                                    }
                                }
                                else if (rest_point <= 2000) {
                                    if (data !== null) {
                                        for (var i = 0; i < data.length; i++) {
                                            if (data[i].action_user.length === 0) {
                                                tmp_list.push(data[i]);
                                            } else {
                                                try {
                                                    data[i].action_user.forEach(function (item) {
                                                        if (item.user_id === auth.user_id) {
                                                            inside = 1;
                                                            throw BreakException;
                                                        }
                                                    });

                                                    if (inside === 0) {
                                                        tmp_list.push(data[i]);
                                                    }

                                                    inside = 0;
                                                } catch (e) {
                                                    if (e !== BreakException) throw e;
                                                }
                                            }
                                        }

                                    }
                                    if (tmp_list.length >= 2) {
                                        list_action_per_day = getRandom(tmp_list, 2);
                                    } else {
                                        list_action_per_day = tmp_list;
                                    }
                                }
                                else {
                                    if (data !== null) {
                                        for (var i = 0; i < data.length; i++) {
                                            if (data[i].action_user.length === 0) {
                                                tmp_list.push(data[i]);
                                            } else {
                                                try {
                                                    data[i].action_user.forEach(function (item) {
                                                        if (item.user_id === auth.user_id) {
                                                            inside = 1;
                                                            throw BreakException;
                                                        }
                                                    });

                                                    if (inside === 0) {
                                                        tmp_list.push(data[i]);
                                                    }

                                                    inside = 0;
                                                } catch (e) {
                                                    if (e !== BreakException) throw e;
                                                }
                                            }
                                        }

                                    }
                                    if (tmp_list.length >= 3) {
                                        list_action_per_day = getRandom(tmp_list, 3);
                                    } else {
                                        list_action_per_day = tmp_list;
                                    }
                                }
                            } else {
                                list_action_per_day = null;
                            }
                        }
                        response = { 'error_code': 0, 'list_action_per_day': list_action_per_day, 'device': req.device.type }
                    }
                }

            }
            res.status(200).json(response);
        });
    },
    getAll: function (req, res) {
        action_model.find({}, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'error_message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, 'action': data };
            }
            res.status(200).json(response);
        });
    },
    update_action: function (req, res) {
        action_model.findById(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                if (data) {
                    data.action_url = req.body.action_url;
                    data.action_id = req.body.action_id;
                    data.action_shop_id = req.body.action_shop_id;
                    if (req.body.action_user !== undefined) {
                        if (req.body.action_user.length > 0) {
                            tmp_user = JSON.parse(req.body.action_user);
                        } else {
                            tmp_user = [];
                        }
                    } else {
                        tmp_user = [];
                    }
                    data.action_user = tmp_user;

                    data.save(function (err) { });
                    response = { 'error_code': 0, 'message': 'update action_user complete' };
                }
                res.status(200).json(response);
            }
        });
    },
    delete_action: function (req, res) {
        action_model.findOneAndRemove({ _id: req.body._id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { "error_code": 0, "message": "Action with is deleted" };
                res.status(200).json(response);
            }
        });
    }
}