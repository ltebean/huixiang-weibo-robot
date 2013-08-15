
var request = require('request');
var mysql = require('mysql');
var config=require('./config.js').loadConfig();

var connection = mysql.createConnection(config.mysql);

connection.query('USE huixiang');
connection.query(
	'SELECT content FROM piece ' +
	'order by RAND() limit 1',
	function selectCb(err, pieces, fields) {
		if (err) {
			throw err;
		}
		pieces.forEach(function(piece) {
			share(piece.content);
			connection.end();
		});
	}
);

//share("test");
function share(content) {
	request.post(
		'https://api.weibo.com/2/statuses/update.json', {
			form: {
				access_token: config.token,
				status: "「"+content+"」－摘自#茴香#"
			}
		},
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("success");
			}else{
				console.log("fail");
			}
		}
	);
}