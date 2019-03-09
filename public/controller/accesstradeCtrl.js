const request = require('request');
const paymentModel = require('../model/payment')
const authModel = require('../model/auth');
const settingModel = require('../model/setting');
const nodeSchedule = require('../node_modules/node-schedule');
const moment = require('moment');
let query, response;

// lấy ngày đầu tháng
function getFirstDateOfMonth() {
	var date = new Date(),
		y = date.getFullYear(),
		m = date.getMonth() - 1;
	var firstDay = new Date(y, m, 1);

	firstDay = moment(firstDay).format('YYYY-MM-DD');
	return firstDay
}

// kiểm tra trùng trong mảng dữ liệu
Array.prototype.contains3 = function (obj) {
	var i = this.length;
	while (i--) {
		if (this[i].user_id === obj) {
			return i;
		}
	}
	return false;
}

// chạy mỗi ngày 1 lần lúc nửa đêm
nodeSchedule.scheduleJob('0 0 * * * *', function () {
	getTransitionFromApi();
})

// lấy danh sách user
async function getListUser(res, listTransition) {
	let Commission;
	function getSetting(callback) {
		settingModel.findOne((err, data) => {
			callback && callback(data);
		});
	}

	await getSetting((data) => {
		Commission = data.commission;
	});

	await authModel.find(function (err, data) {
		if (data.length > 0) {
			let T = JSON.parse(listTransition);
			// res.send(T.data);

			T.data.forEach(async (element, index) => {
				if (data.contains3(element.utm_source) !== false) {
					let i = data.contains3(element.utm_source);
					await checkTranssion(element, data[i], Commission);
				}
			})
		}
	});
}

// cập nhật điểm cho user khi đơn hàng được duyệt
function updateDetailUser(userId, points) {
	authModel.findById(userId, (err, data) => {
		if (err) {
			console.log('lấy thông tin user có lỗi: ' + err);
		} else {
			data.point_plus = data.point_plus + points;
			data.save(err => {
				if (err) {
					console.log('Cập nhật thông tin user có lỗi: ' + err);
				}
			})
		}
	})
}

// lấy danh sách giao dịch của user
function checkTranssion(Transactions, users, Commission) {
	let toDay = moment(new Date()).format('DD/MM/YYYY');
	let toDayIso = moment(new Date()).format('YYYY-MM-DD');
	let query = {
		transactionId: Transactions.transaction_id
	}

	paymentModel.find(query, (err, data) => {
		if (err) {
			console.log('lỗi checkTranssion: ' + err);
		} else {
			let status = {
				id: 0,
				name: 'Đang xử lý'
			}
			if (data.length === 0) {
				let payment = new paymentModel({
					authBuy: {
						id: Transactions.utm_source,
						name: users.info[0].fulname
					},
					transactionId: Transactions.transaction_id,
					originName: Transactions.merchant,
					productName: Transactions.product_name,
					productPrice: Transactions.product_price,
					productCommission: Transactions.commission,
					rewardPoint: 0,
					dayBuy: toDay,
					dayBuyIso: toDayIso,
					dayComfirm: null,
					dayComfirmIso: null,
					isUse: false,
					paymentStatus: {
						id: 0,
						name: 'Đang xử lý'
					}
				});

				payment.save(err => {
					if (err) {
						console.log('Tạo đơn hàng lỗi: ' + err);
					}
				})
			} else {
				data.forEach(async element => {
					if (element.paymentStatus[0].id === 0 && Transactions.status !== 0) {
						if (Transactions.status === 1) {
							status = {
								id: 1,
								name: 'Giao dịch thành công'
							}
							rewardPoint = Math.round(Commission * Transactions.commission);
							updateDetailUser(rewardPoint, users._id);
						} else {
							status = {
								id: 2,
								name: 'Giao dịch bị từ chối'
							}
							rewardPoint = element.rewardPoint;
						}

						if (Transactions.status === 1) {
							element.dayComfirm = toDay;
							element.dayComfirmIso = toDayIso;
							element.rewardPoint = rewardPoint;
						}
						element.paymentStatus = status;
						await element.save(err => {
							if (err) {
								console.log('Cập nhật trạng thái đơn hàng lỗi: ' + err);
							}
						})
					}
				})
			}

		}
	})

}

// lấy danh sách giao dịch từ api
function getTransitionFromApi(res) {
	let fromDay = getFirstDateOfMonth() + 'T00:00:00Z';
	let toDay = moment(new Date()).format('YYYY-MM-DD') + 'T00:00:00Z'

	const options = {
		url: 'https://api.accesstrade.vn/v1/transactions?since=' + fromDay + '&until=2019-03-10T00:00:00Z',
		headers: {
			'Authorization': 'Token OxEjBHQ4rUWk6wyvy35PYzW0LaZr3R9_',
			'Content-Type': 'application/json'
		}
	}

	function callback(error, response, body) {
		if (!error && response.statusCode == 200) {
			getListUser(res, body);
			// res.send(body);
		}
	}
	request(options, callback);

}

module.exports = {
	TransactionsGetByUserId: function (req, res) {
		query = {
			'authBuy.id': req.query.userid
		};

		paymentModel.find(query, (err, data) => {
			if (err) {
				response = { 'error_code': 1, 'sms': 'error fetching data' }
				console.log('lỗi lấy list giao dịch của user: ' + req.query.userid + ' với lỗi: ' + err);
				res.status(200).json(response);
			} else {
				response = { 'error_code': 0, 'payments': data }
				res.status(200).json(response);
			}
		})
	},

	TransactionsGetAll: function (req, res) {
		paymentModel.find((err, data) => {
			if (err) {
				response = { 'error_code': 1, 'sms': 'error fetching data' }
				console.log('lỗi lấy list giao dịch của user: ' + req.query.userid + ' với lỗi: ' + err);
				res.status(200).json(response);
			} else {
				response = { 'error_code': 0, 'payments': data }
				res.status(200).json(response);
			}
		})
	},

	Setting: (req, res) => {
		settingModel.findOne((err, data) => {
			if (data !== null) {
				data.commission = req.body.com;
				data.save(err => {
					if (err) {
						response = { 'error_code': 1, 'sms': 'error fetching data' };
						console.log('Update setting có lỗi: ' + err);
						res.status(200).json(response);
					} else {
						response = { 'error_code': 0, 'sms': 'create setting success' };
						res.status(200).json(response);
					}
				})
			} else {
				let setting = new settingModel({
					commission: req.body.com
				});
				setting.save(err => {
					if (err) {
						response = { 'error_code': 1, 'sms': 'error fetching data' };
						console.log('Tạo setting có lỗi: ' + err);
						res.status(200).json(response);
					} else {
						response = { 'error_code': 0, 'sms': 'create setting success' };
						res.status(200).json(response);
					}
				})
			}
		})
	},

	getSetting: (req, res) => {
		settingModel.findOne((err, data) => {
			if (err) {
				response = { 'error_code': 1, 'sms': 'error fetching data' };
				console.log('lấy thông tin setting có lỗi: ' + err);
				res.status(200).json(response);
			} else {
				response = { 'error_code': 0, 'com': data };
				res.status(200).json(response);
			}
		})
	}
}
