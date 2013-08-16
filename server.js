var request = require('request');
var moment = require('moment');
var mysql = require('mysql');
var config = require('./config.js').loadConfig();
var weibo = require('./weibo.js');
var Step = require('step');
var cronJob = require('cron').CronJob;

new cronJob({
	cronTime: '*/1 * * * *',
	onTick: checkMentions,
	start: true
}).start();

new cronJob({
	cronTime: '0 * * * *',
	onTick: autoShare,
	start: true
}).start();

function autoShare() {
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
				weibo.share(piece.content);
			});
			connection.end();
		}
	);
}

function checkMentions() {
	Step(
		function getUnreadCount() {
			weibo.getUnread(this);
		},
		function getUnreadMentions(unreadCount) {
			if (!unreadCount || unreadCount.mention_status == 0) {
				return;
			}
			weibo.getMentions(unreadCount.mention_status, this);
		},
		function createPieceFromMention(mentions) {
			if (!mentions || mentions.length == 0) {
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
					createPiece(userWeiboId, mention.id, content,mention.retweeted_status);
				}
			};
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

	function createPiece(weiboId, mentionId, content,retweet) {
		console.log("create piece success: " + content);

		var connection = mysql.createConnection(config.mysql);
		Step(
			function checkUser() {
				connection.query(
					'SELECT * FROM user ' +
					'where weiboid=' + weiboId,
					function selectCb(err, users, fields) {
						if (err) {
							throw err;
						}
						if (!users.length) {
							weibo.comment(mentionId, "请注册^^");
							console.log("new user: need sign up");
							return false;
						}
						return users[0];
					}
				);
			}, function createPiece(user) {
				if (user) {
					console.log("insert piece into db");
					connection.query(
						'INSERT into piece set ? ', {
							content: content,
							user: user.id,
							addtime:moment().format("YYYY-MM-DD hh:mm:ss"),
							link: retweet && "http://weibo.com/"+retweet.user.id+"/"+retweet.id
						}, function() {
							weibo.comment(mention.id, "已添加至收藏~");
						})
				}

			});

	}
}