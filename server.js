var request = require('request');
var moment = require('moment');
var mysql = require('mysql');
var config = require('./config.js').loadConfig();
var weibo = require('./weibo.js');
var Step = require('step');
var cronJob = require('cron').CronJob;

new cronJob({
	cronTime: config.cron.checkMentions,
	onTick: checkMentions,
	start: true
}).start();

new cronJob({
	cronTime: config.cron.autoShare,
	onTick: autoShare,
	start: true
}).start();

function autoShare() {
	var connection = mysql.createConnection(config.mysql);
	connection.query('USE huixiang');
	connection.query(
		'SELECT content FROM piece ' +
		'where length(content) > 30 ' +
		'order by RAND() limit 1',
		function selectCb(err, pieces, fields) {
			if (err) {
				throw err;
			}
			pieces.forEach(function(piece) {
				weibo.share(piece.content);
			});
			connection.end();
		}
	);
}

function autoShareByWebAPI(){
	var request = require('request');
    request("http://huixiang.im/api/pieces", function(error, response, body) {
        if (!error && response.statusCode == 200 && body) {
            var data = JSON.parse(body);
            weibo.share(data[0].content);               
        } 
    });
}

function checkMentions() {
	Step(
		function getUnreadCount() {
			weibo.getUnread(this);
		},
		function getUnreadMentions(unreadCount) {
			if (!unreadCount || unreadCount.mention_status === 0) {
				return;
			}
			weibo.getMentions(unreadCount.mention_status, this);
		},
		function createPieceFromMention(mentions) {
			if (!mentions || mentions.length === 0) {
				return;
			}
			for (var i = mentions.length - 1; i >= 0; i--) {
				var mention = mentions[i];
				var content;
				// check retweet
				if (mention.retweeted_status) {
					content = mention.retweeted_status.text;
				} else {
					content = truncateContent(mention.text);
				}
				var userWeiboId = mention.user.id;
				if (content) {
					createPiece(userWeiboId, mention.id, content, mention.retweeted_status);
				}
			}
			weibo.clearUnread();
		});

	function truncateContent(mention) {
		var result = /@\S+ (.+)/.exec(mention);
		if (result && result[1]) {
			return result[1];
		}
		result = /(.+)@\S+/.exec(mention);
		if (result && result[1]) {
			return result[1];
		}
		return null;
	}

	function createPiece(weiboId, mentionId, content, retweet) {
		checkUser(insertPiece);

		function checkUser(cb) {
			var connection = mysql.createConnection(config.mysql);
			connection.query(
				'SELECT * FROM user ' +
				'where weibo_id=' + weiboId,
				function selectCb(err, users, fields) {
					if (err) {
						throw err;
					}
					if (!users.length) {
						weibo.comment(mentionId, "请注册^^");
						return;
					}
					connection.end();
					cb(users[0]);
				}
			);
		}

		function insertPiece(user) {
			if (user) {
				var connection = mysql.createConnection(config.mysql);
				console.log("insert piece into db");
				connection.query(
					'INSERT into piece set ? ', {
						content: content,
						user: user.id,
						addtime: moment().format("YYYY-MM-DD hh:mm:ss"),
						link: retweet && "http://weibo.com/" + retweet.user.id + "/" + retweet.id
					}, function() {
						connection.end();
						weibo.comment(mention.id, "已添加至收藏~");
					})
			}
		}

	}
}