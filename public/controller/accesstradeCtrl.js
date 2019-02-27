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
Array.prototype.contains = function (obj) {
	var i = this.length;
	while (i--) {
		if (this[i].user_id === obj) {
			return i;
		}
	}
	return false;
}

// chạy mỗi ngày 1 lần lúc nửa đêm
nodeSchedule.scheduleJob('0 0 9 * * *', function () {
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
				if (data.contains(element.utm_source) !== false) {
					let i = data.contains(element.utm_source);
					await checkTranssion(element, data[i].info[0].fulname, Commission);
				}
			})
		}
	});
}

// lấy danh sách giao dịch của user
function checkTranssion(Transactions, fullname, Commission) {
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
						name: fullname
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
				if (data[0].paymentStatus[0].id === 0 && Transactions.status !== 0) {
					if (Transactions.status === 1) {
						status = {
							id: 1,
							name: 'Giao dịch thành công'
						}
						rewardPoint = Math.round(Commission * Transactions.commission);
					} else {
						status = {
							id: 2,
							name: 'Giao dịch bị từ chối'
						}
					}

					if (Transactions.status === 1) {
						data[0].dayComfirm = toDay;
						data[0].dayComfirmIso = toDayIso;
						data[0].rewardPoint = rewardPoint;
					}
					data[0].paymentStatus = status;
					data[0].save(err => {
						if (err) {
							console.log('Cập nhật trạng thái đơn hàng lỗi: ' + err);
						}
					})
				}
			}

		}
	})

}

// lấy danh sách giao dịch từ api
function getTransitionFromApi(res) {
	let fromDay = getFirstDateOfMonth() + 'T00:00:00Z';
	let toDay = moment(new Date()).format('YYYY-MM-DD') + 'T00:00:00Z'

	const options = {
		url: 'https://api.accesstrade.vn/v1/transactions?since=' + fromDay + '&until=' + toDay,
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
			authBuy: req.query.userid
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
