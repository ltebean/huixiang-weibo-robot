var request = require('request');
var config = require('./config.js').loadConfig();

exports.share = function(content) {
	request.post(
		'https://api.weibo.com/2/statuses/update.json', {
			form: {
				access_token: config.token,
				status: "「" + content + "」－摘自#茴香#"
			}
		},
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("share success");
			} else {
				console.log("share fail");
				console.log(body);
			}
		}
	);
}

exports.getUnread = function(cb) {
	request.get(
		'https://rm.api.weibo.com/2/remind/unread_count.json?access_token=' + config.token,
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("getUnread success");
				cb(JSON.parse(body));
			} else {
				console.log("getUnread fail");
				console.log(body);
			}
		}
	);
}

exports.getMentions = function(count, cb) {
	request.get(
		'https://api.weibo.com/2/statuses/mentions.json?access_token=' + config.token,
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("get mentions success");
				cb(JSON.parse(body).statuses);
			} else {
				console.log("get mentions fail");
				console.log(body);
			}
		}
	);
}

exports.comment = function(weiboId, comment) {
	request.post(
		'https://api.weibo.com/2/comments/create.json', {
			form: {
				access_token: config.token,
				comment: comment,
				id: weiboId
			}
		},
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("comment success");
			} else {
				console.log("comment fail");
				console.log(body);
			}
		}
	);
}

exports.clearUnread = function() {
	request.post(
		'https://rm.api.weibo.com/2/remind/set_count.json', {
			form: {
				access_token: config.token,
				type: "mention_status"
			}
		},
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("clear success");
			} else {
				console.log("clear fail");
				console.log(body);
			}
		}
	);
}