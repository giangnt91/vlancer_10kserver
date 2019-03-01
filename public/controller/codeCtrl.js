// get model
code_model = require('../model/code');
emarket_model = require('../model/emarket');
slider_model = require('../model/slider');

var dateFormat = require('dateformat');
var schedule = require('node-schedule');

// compare day
function compareday(x) {
    var parts = x.split("/");
    return parts[2] + '' + parts[1] + '' + parts[0];
}

function CheckCodeExpired() {
    let day = dateFormat(new Date(), "yyyymmdd");
    code_model.find({}, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            if (data.length > 0) {
                data.forEach(element => {
                    let expired = compareday(element.Expireday);
                    if (expired < day) {
                        element._Status = {
                            id: 0,
                            name: "Hết Hạn"
                        }
                        element.save(function (err) { });
                    }
                })
            }
        }
    })
}

// chạy mỗi nửa đêm cho basic coupon
schedule.scheduleJob('0 0 * * *', function () {
    CheckCodeExpired();
});

// create emarket
function create_emarket(_ename, _eimg) {
    var emarket = new emarket_model({
        Ename: _ename,
        Eimg: _eimg
    });

    emarket.save(function (err) {
        if (err) {
            console.log('create emarket ' + err)
        }
    })
}

// create basic code
function create_basic_code(_Eid, _Ename, _Eimg, _Code, _Url, _Industry, _Info, _ValueC, _Expireday) {
    var day = dateFormat(new Date(), "dd/mm/yyyy");
    let _status = {
        id: 1,
        name: "Còn Hạn"
    }
    var code = new code_model({
        Eid: _Eid,
        Ename: _Ename,
        Eimg: _Eimg,
        Code: _Code,
        Url: _Url,
        Industry: _Industry,
        Info: _Info,
        ValueC: _ValueC,
        Expireday: _Expireday,
        Releaseday: day,
        _Status: _status
    });

    code.save(function (err) {
        if (err) {
            response = { 'error_code': 2, 'message': 'error create new Basic coupon ' };
        } else {
            response = { 'error_code': 0, 'message': 'new Basic coupon  is created !' };
        }
        // res.status(200).json(response);
    })
}

// api
module.exports = {
    // create slider
    Slider: function (req, res) {
        let _slider = new slider_model({
            ShopId: req.body.ShopId,
            Button: req.body.Button,
            Url: req.body.Url,
            Image: null
        });

        _slider.save(function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, '_id': data.id };
                res.status(200).json(response);
            }
        })
    },

    upSlider: function (req, res, server_url) {
        slider_model.findById({ _id: req.body.shopId }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                var img = JSON.parse(req.body.img);
                _slider = server_url + img[0].slider;

                data.Image = _slider;
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
        });
    },

    getSlider: function (req, res) {
        slider_model.find({}, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, 'sliders': data }
            }
            res.status(200).json(response);
        }).sort({
            _id: -1
        })
    },

    rmSlider: function (req, res) {
        slider_model.findByIdAndRemove({ _id: req.body._id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, 'message': 'slider is remove' };
            }
            res.status(200).json(response);
        })
    },

    // get emarket
    getEmarket: function (req, res) {
        emarket_model.find({}, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, 'emarket': data }
            }
            res.status(200).json(response);
        });
    },

    // create emarket
    emarket: function (req, res) {
        create_emarket(req.body.ename, req.body.eimg);
        response = { 'error_code': 0, 'message': 'emarket  is created !' }
        res.status(200).json(response);
    },

    // update emarket
    updateEmarket: (req, res) => {
        emarket_model.findById(req.body.Emarket._id, (err, data) => {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
                res.status(200).json(response);
            } else {
                data.Ename = req.body.Emarket.Ename;
                data.Eimg = req.body.Emarket.Eimg;

                data.save(err => {
                    if (err) {
                        response = { 'error_code': 1, 'message': 'error fetching data' };
                        res.status(200).json(response);
                    } else {
                        response = { 'error_code': 0, 'sms': 'update succes' }
                        res.status(200).json(response);
                    }
                })
            }
        })
    },

    // create basic
    basic_code: function (req, res) {
        create_basic_code(req.body.Eid, req.body.Ename, req.body.Eimg, req.body.Code, req.body.Url, req.body.Industry, req.body.Info, req.body.ValueC, req.body.Expireday);
        response = { 'error_code': 0, 'message': 'new Basic coupon  is created !' }
        res.status(200).json(response);
    },

    // get basic
    get_basic: function (req, res) {
        code_model.find({}, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, 'basic': data }
                res.status(200).json(response);
            }
        });
    },

    avatar: function (req, res, server_url) {
        code_model.find({ code_coupon: req.body.shopId }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                var img = JSON.parse(req.body.img);
                avatar = server_url + img[0].avatar;

                data[0].shopImg = avatar;
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
    Update: function (req, res) {
        code_model.findById({ _id: req.body._id }, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                data.Eid = req.body.Eid;
                data.Ename = req.body.Ename;
                data.Eimg = req.body.Eimg;
                data.Code = req.body.Code;
                data.Url = req.body.Url;
                data.Industry = req.body.Industry;
                data.Info = req.body.Info;
                data.ValueC = req.body.ValueC;
                data.Expireday = req.body.Expireday;

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
    Remove: function (req, res) {
        code_model.findByIdAndRemove(req.body._id, function (err, data) {
            if (err) {
                response = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                response = { 'error_code': 0, 'message': 'code is remove' };
            }
            res.status(200).json(response);
        })
    }
}