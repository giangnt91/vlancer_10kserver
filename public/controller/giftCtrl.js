// plugin
const dateFormat = require('dateformat');
const mongoose = require('mongoose');

// model
const giftModel = require('../model/gift');
const authModel = require('../model/auth');
let response, query;

module.exports = {
  giftAddNew: (req, res) => {
    let today = dateFormat(new Date(), "dd/mm/yyyy");
    let todayIso = dateFormat(new Date(), "yyyy-mm-dd");

    let newGift = new giftModel({
      giftShop: req.body.gift.giftShop,
      giftName: req.body.gift.giftName,
      giftPrice: req.body.gift.giftPrice,
      giftPoint: req.body.gift.giftPoint,
      giftInfo: req.body.gift.giftInfo,
      giftCreateDay: today,
      giftCreateDayIso: todayIso,
      giftExpiredDay: req.body.gift.giftExpiredDay,
      giftExpiredDayIso: req.body.gift.giftExpiredDayIso,
      giftAddress: req.body.gift.giftAddress,
      giftTotal: req.body.gift.giftTotal,
      giftUserHasTaken: 0,
      giftImages: req.body.gift.giftImages,
      giftListUser: null,
      giftTurn: new mongoose.Types.ObjectId(),
      giftDisable: false
    })

    newGift.save(err => {
      if (err) {
        console.log('Tạo gift bị lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        response = { 'error_code': 0, 'sms': 'gift add success' };
        res.status(200).json(response);
      }
    })
  },

  giftGetAll: (req, res) => {
    query = {
      giftDisable: false,
      $where: 'this.giftTotal > this.giftUserHasTaken'
    }
    giftModel.find(query, (err, data) => {
      if (err) {
        console.log('Lấy danh sách gift bị lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        response = { 'error_code': 0, 'gifts': data };
        res.status(200).json(response);
      }
    }).sort({
      _id: -1
    });
  },

  giftEdit: (req, res) => {
    query = {
      _id: req.body.gift._id
    }

    giftModel.findById(query, (err, data) => {
      if (err) {
        console.log('Lấy thông tin gift bị lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        data.giftShop = req.body.gift.giftShop;
        data.giftName = req.body.gift.giftName;
        data.giftPrice = req.body.gift.giftPrice;
        data.giftPoint = req.body.gift.giftPoint;
        data.giftInfo = req.body.gift.giftInfo;
        data.giftCreateDay = req.body.gift.giftCreateDay;
        data.giftCreateDayIso = req.body.gift.giftCreateDayIso;
        data.giftExpiredDay = req.body.gift.giftExpiredDay;
        data.giftExpiredDayIso = req.body.gift.giftExpiredDayIso;
        data.giftAddress = req.body.gift.giftAddress;
        data.giftTotal = req.body.gift.giftTotal;
        data.giftImages = req.body.gift.giftImages;
        data.giftDisable = req.body.gift.giftDisable;
        data.giftUserHasTaken = req.body.gift.giftUserHasTaken;
        data.giftListUser = req.body.gift.giftListUser;

        data.save(err => {
          if (err) {
            console.log('lưu thông tin gift bị lỗi: ' + err);
            response = { 'error_code': 1, 'sms': 'error fetching data' };
            res.status(200).json(response);
          } else {
            response = { 'error_code': 0, 'sms': 'save data success' };
            res.status(200).json(response);
          }
        })
      }
    })
  },

  giftGetById: (req, res) => {
    query = {
      _id: req.query._id
    }

    giftModel.findById(query, (err, data) => {
      if (err) {
        console.log('Lấy thông tin gift bị lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        response = { 'error_code': 0, 'gift': data };
        res.status(200).json(response);
      }
    })
  },

  giftUpdateUserGet: (req, res) => {
    authModel.findById(req.body.auth._id, (err, data) => {
      if (err) {
        console.log('Lấy thông tin user nhận quà lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        data.point_plus = req.body.auth.point_plus;
        data.gifts = req.body.auth.gifts;

        data.save(err => {
          if (err) {
            console.log('Lưu thông tin user nhận quà lỗi: ' + err);
            response = { 'error_code': 1, 'sms': 'error fetching data' };
            res.status(200).json(response);
          } else {
            response = { 'error_code': 0, 'sms': 'save user get gift success' };
            res.status(200).json(response);
          }
        })
      }
    })
  },

  giftUpdateExpire: (req, res) => {
    authModel.findById(req.body.auth._id, (err, data) => {
      if (err) {
        console.log('Lấy thông tin user cập nhật quà lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        data.gifts = req.body.auth[0].gifts;

        data.save(err => {
          if (err) {
            console.log('Lưu thông tin user cập nhật quà lỗi: ' + err);
            response = { 'error_code': 1, 'sms': 'error fetching data' };
            res.status(200).json(response);
          } else {
            response = { 'error_code': 0, 'sms': 'save expireday gift success' };
            res.status(200).json(response);
          }
        })
      }
    })
  }
}

