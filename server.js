var token = "2.00C2CEAEW93AsCacf7e25d1a1HXORC";


var request = require('request');
var mysql = require('mysql');

var connection = mysql.createConnection({
	host: 'localhost',
	user: '',
	password: '',
	insecureAuth: true
});

connection.query('USE huixiang');
connection.query(
	'SELECT content FROM piece ' +
	'order by RAND() limit 1',
	function selectCb(err, piece, fields) {
		if (err) {
			throw err;
		}
		piece.forEach(function(cartoon) {
			share(piece.content));
			connection.end();
		});
	}
);

function share(content) {
	request.post(
		'https://api.weibo.com/2/statuses/update.json', {
			form: {
				access_token: token,
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