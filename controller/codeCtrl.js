// get model
code_model = require('../model/code');

// create basic code
function create_basic_code(_shopid, _shop_img, _info_coupon, _code_coupon, _expire_day, _shop_url) {
    var code = new code_model({
        shopId: _shopid,
        shopImg: _shop_img,
        info_coupon: _info_coupon,
        code_coupon: _code_coupon,
        expire_day: _expire_day,
        shopUrl: _shop_url
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
    // create basic
    basic_code: function (req, res) {
        create_basic_code(req.body.shopId, req.body.shopImg, req.body.info_coupon, req.body.code_coupon, req.body.expire_day, req.body.shopUrl);
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
        code_model.find({ code_coupon: req.body.code_coupon }, function (err, data) {
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
    }
}