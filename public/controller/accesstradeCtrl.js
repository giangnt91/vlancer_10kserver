var request = require('request');

module.exports = {
	getListTransition: function (req, res){
		const options = {
			url: 'https://api.accesstrade.vn/v1/transactions?since=2016-08-01T00:00:00Z&until=2019-01-01T00:00:00Z',
			headers: {
				'Authorization': 'Token OxEjBHQ4rUWk6wyvy35PYzW0LaZr3R9_',
				'Content-Type': 'application/json'
			}
		}
		function callback(error, response, body){
			if (!error && response.statusCode == 200) {
				// res.status(200).json(body);
				res.send(body);
			}
		}
		request(options, callback);
	}
}
