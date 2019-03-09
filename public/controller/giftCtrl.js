// plugin
const dateFormat = require('dateformat');
const mongoose = require('mongoose');
const nodeSchedule = require('../node_modules/node-schedule');


// model
const giftModel = require('../model/gift');
const authModel = require('../model/auth');
let response, query;

// function check hạn của gift
formatDayCal = (dayFormat) => {
  if (dayFormat !== undefined) {
    let parts = dayFormat.split("/");
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
}

treatAsUTC = (date) => {
  var result = new Date(date);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
}

daysBetween = (startDate, endDate) => {
  var millisecondsPerDay = 24 * 60 * 60 * 1000;
  return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}


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

// kiểm tra trùng trong mảng dữ liệu
Array.prototype.contains2 = function (obj) {
  var i = this.length;
  while (i--) {
    if (this[i]._id === obj) {
      return i;
    }
  }
  return false;
}

// chạy mỗi ngày 1 lần lúc nửa đêm
nodeSchedule.scheduleJob('0 0 9 * * *', function () {
  disableGiftExpire();
})

// cập nhật quà hết hạn vào 12h đêm hàng ngày
disableGiftExpire = () => {
  let today = dateFormat(new Date(), "yyyy-mm-dd");
  query = {
    giftDisable: false
  }

  giftModel.find(query, (err, data) => {
    if (err) {
      console.log('giftCtrl line 32: ' + err);
    } else {
      try {
        data.forEach(async element => {
          if (daysBetween(today, formatDayCal(element.giftExpiredDay)) < 0) {
            element.giftDisable = true;
            await element.save(err => {
              if (err) {
                console.log('giftCtrl line 65: ' + err);
              }
            })
          }
        })
      } catch (err) {
        console.log('giftCtrl line 41: ' + err);
      }
    }
  })
}

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

        if(req.body.gift.giftTotal !== undefined){
          data.giftTotal = req.body.gift.giftTotal;
        }
        
        data.giftImages = req.body.gift.giftImages;
        data.giftDisable = req.body.gift.giftDisable;

        if(req.body.gift.giftUserHasTaken !== undefined){
          data.giftUserHasTaken = req.body.gift.giftUserHasTaken;
        }
        
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
        data.gifts = req.body.auth.gifts;

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
  },

  giftUserUse: (req, res) => {
    giftModel.findById(req.body._id, (err, data) => {
      if (err) {
        console.log('Lấy thông tin user sử dụng quà lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        let user = {
          id: req.body.auth._id,
          name: req.body.auth.info[0].fulname,
          image: req.body.auth.user_img,
          status: 1
        }
        let listUser = data.giftListUserUse;

        if (listUser !== null && listUser !== undefined) {
          if (listUser.contains(req.body.auth._id) === false) {
            listUser.push(user);
          }
        } else {
          listUser = [user];
        }

        data.giftListUserUse = listUser;
        data.save(err => {
          if (err) {
            console.log('Lưu thông tin user sử dụng quà lỗi: ' + err);
            response = { 'error_code': 1, 'sms': 'error fetching data' };
            res.status(200).json(response);
          } else {
            response = { 'error_code': 0, 'sms': 'save gift success' };
            res.status(200).json(response);
          }
        })
      }
    })
  },

  giftRemoveUserUse: (req, res) => {
    giftModel.findById(req.body._id, (err, data) => {
      if (err) {
        console.log('Lấy thông tin user sử dụng quà lỗi: ' + err);
        response = { 'error_code': 1, 'sms': 'error fetching data' };
        res.status(200).json(response);
      } else {
        let listUser = data.giftListUserUse;
        let index = listUser.contains(req.body.auth._id);
        listUser.splice(index, 1);

        data.giftListUserUse = listUser;
        data.save(err => {
          if (err) {
            console.log('Lưu thông tin user sử dụng quà lỗi: ' + err);
            response = { 'error_code': 1, 'sms': 'error fetching data' };
            res.status(200).json(response);
          } else {
            response = { 'error_code': 0, 'sms': 'save gift success' };
            res.status(200).json(response);
          }
        })
      }
    })
  },

  giftGetRequest: (req, res) => {
    giftModel.find((err, data) => {
      if (err) {
        console.log('giftCtrl line 303: ' + err);
      } else {
        try {
          let listRequest = [];
          data.forEach(async element => {
            if (element.giftListUserUse !== undefined && element.giftListUserUse !== null) {
              await element.giftListUserUse.forEach(user => {
                if (user.status === 1) {
                  let newItem = {
                    _id: element._id,
                    giftName: element.giftName,
                    giftPrice: element.giftPrice,
                    giftPoint: element.giftPoint,
                    giftInfo: element.giftInfo,
                    giftCreateDay: element.giftCreateDay,
                    giftCreateDayIso: element.giftCreateDayIso,
                    giftExpiredDay: element.giftExpiredDay,
                    giftExpiredDayIso: element.giftExpiredDayIso,
                    giftAddress: element.giftAddress,
                    giftTurn: element.giftTurn,
                    giftDisable: element.giftDisable,
                    giftImages: element.giftImages,
                    giftShop: element.giftShop,
                    auth: user
                  }
                  listRequest.unshift(newItem);
                }
              })
            }
          })

          response = { 'error_code': 0, 'gifts': listRequest };
          res.status(200).json(response);
        } catch (err) {
          console.log('giftCtrl line 308: ' + err);
        }
      }
    })
  },

  giftAcceptRequestForShop: (req, res) => {
    giftModel.findById(req.body.gift._id, (err, data) => {
      if (err) {
        console.log('error gift line 347: ' + err);
      } else {
        try {
          let index = data.giftListUserUse.contains(req.body.gift.auth.id);
          newgift = {
            id: data.giftListUserUse[index].id,
            name: data.giftListUserUse[index].name,
            image: data.giftListUserUse[index].image,
            reviewid: req.body.gift.auth.reviewid,
            reviewname: req.body.gift.auth.reviewname,
            reviewimage: req.body.gift.auth.reviewimage,
            status: 0
          }
          data.giftListUserUse.splice(index, 1);
          data.giftListUserUse.unshift(newgift);
          data.save(err => {
            if (err) {
              console.log('error gift line 364: ' + err);
              response = { 'error_code': 1, 'sms': 'error fetching data' };
              res.status(200).json(response);
            } else {
              response = { 'error_code': 0, 'sms': 'save gift success' };
              res.status(200).json(response);
            }
          })
        } catch (err) {
          console.log('error gift line 368: ' + err);
        }
      }
    });
  },

  giftAcceptRequestForUser: (req, res) => {
    authModel.findById(req.body.gift.auth.id, (err, data) => {
      if (err) {
        console.log('error gift line 382: ' + err);
      } else {
        try {
          let index = data.gifts.contains2(req.body.gift._id);
          let today = dateFormat(new Date(), "dd/mm/yyyy");
          let todayIso = dateFormat(new Date(), "yyyy-mm-dd");
          newgift = {
            _id: data.gifts[index]._id,
            giftShop: data.gifts[index].giftShop,
            giftName: data.gifts[index].giftName,
            giftPrice: data.gifts[index].giftPrice,
            giftPoint: data.gifts[index].giftPoint,
            giftInfo: data.gifts[index].giftInfo,
            giftCreateDay: data.gifts[index].giftCreateDay,
            giftCreateDayIso: data.gifts[index].giftCreateDayIso,
            giftExpiredDay: data.gifts[index].giftExpiredDay,
            giftExpiredDayIso: data.gifts[index].giftExpiredDayIso,
            giftUseDay: today,
            giftUseDayIso: todayIso,
            giftAddress: data.gifts[index].giftAddress,
            giftImages: data.gifts[index].giftImages,
            giftTurn: data.gifts[index].giftTurn,
            giftGetDay: data.gifts[index].giftGetDay,
            giftUse: true,
            giftDisable: true
          }
          data.gifts.splice(index, 1);
          data.gifts.unshift(newgift);
          data.save(err => {
            if (err) {
              console.log('error gift line 423: ' + err);
              response = { 'error_code': 1, 'sms': 'error fetching data' };
              res.status(200).json(response);
            } else {
              response = { 'error_code': 0, 'sms': 'save gift success' };
              res.status(200).json(response);
            }
          })
        } catch (err) {
          console.log('error gift line 432: ' + err);
        }
      }
    });
  }
}

