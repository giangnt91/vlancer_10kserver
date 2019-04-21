// model
const hotModel = require('../model/hot');
const dateFormat = require('dateformat');
const schedule = require('node-schedule');
let response;

function formatDayIso(dayFormat) {
  let parts = dayFormat.split("/");
  let iday = parseInt(parts[0]) + 1;
  return parts[1] + '-' + iday + '-' + parts[2];
}


module.exports = {
  hotDealCreate: (req, res) => {
    let today = dateFormat(new Date(), "dd/mm/yyyy");

    let hotDeal = new hotModel({
      urlImage: req.body.hotDeal.urlImage,
      Info: req.body.hotDeal.Info,
      urlCommission: req.body.hotDeal.urlCommission,
      expiredDay: req.body.hotDeal.expiredDay,
      expiredDayIso: req.body.hotDeal.expiredDayIso,
      createDay: today,
      createDayIso: formatDayIso(today)
    })

    hotDeal.save(err => {
      if (err) {
        console.log('Tạo mã khuyến mãi có lỗi: ' + err);
        response = {
          'error_code': 1,
          'sms': 'error fetching data'
        };
        res.status(200).json(response);
      } else {
        response = {
          'error_code': 0,
          'sms': 'create hot deal success'
        };
        res.status(200).json(response);
      }
    })
  },

  hotDealGetAll: (req, res) => {
    let today = dateFormat(new Date(), "yyyy-mm-dd");
    let query = {
      expiredDayIso: {
        $gte: today
      }
    }
    hotModel.find(query, (err, data) => {
      if (err) {
        console.log('Lỗi lấy danh sách khuyến mãi hot: ' + err);
      } else {
        response = {
          'error_code': 0,
          'hots': data
        };
        res.status(200).json(response);
      }
    }).sort({
      _id: -1
    })
  },

  hotDealUpdateById: (req, res) => {
    hotModel.findById(req.body.hotDeal._id, (err, data) => {
      if (err) {
        console.log('Update mã khuyến mãi có lỗi: ' + err);
        response = {
          'error_code': 1,
          'sms': 'error fetching data'
        };
        res.status(200).json(response);
      } else {
        data.urlImage = req.body.hotDeal.urlImage;
        data.urlCommission = req.body.hotDeal.urlCommission;
        data.Info = req.body.hotDeal.Info;
        data.expiredDay = req.body.hotDeal.expiredDay;
        data.expiredDayIso = req.body.hotDeal.expiredDayIso;

        data.save(err => {
          if (err) {
            console.log('Lưu khuyến mãi hot: ' + err);
          } else {
            response = {
              'error_code': 0,
              'sms': 'update success'
            };
            res.status(200).json(response);
          }
        })
      }
    })
  },

  hotDealDelById: (req, res) => {
    hotModel.findByIdAndRemove({
      _id: req.body._id
    }, (err, data) => {
      if (err) {
        console.log('Delete mã khuyến mãi có lỗi: ' + err);
        response = {
          'error_code': 1,
          'sms': 'error fetching data'
        };
        res.status(200).json(response);
      } else {
        response = {
          'error_code': 0,
          'sms': 'delete success'
        };
        res.status(200).json(response);
      }
    })
  }
}