// get model
code_model = require('../model/code');
emarket_model = require('../model/emarket');

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
    var code = new code_model({
        Eid: _Eid,
        Ename: _Ename,
        Eimg: _Eimg,
        Code: _Code,
        Url: _Url,
        Industry: _Industry,
        Info: _Info,
        ValueC: _ValueC,
        Expireday: _Expireday
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
            }
            res.status(200).json(response);
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
        code_model.findById({_id: req.body._id}, function (err, data) {
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