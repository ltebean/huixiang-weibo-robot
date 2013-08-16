var request = require('request');
var mysql = require('mysql');
var config = require('./config.js').loadConfig();
var weibo = require('./weibo.js');
var Step = require('step');

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
				connection.end();
			});
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
		function sendReply(mentions) {
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
				if(content){
					createPiece(userWeiboId, content);
					weibo.comment(mention.id, "已添加至收藏~");
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

	function createPiece(weiboId, content) {
		console.log("create piece success: " + content);
	}
}



checkMentions();