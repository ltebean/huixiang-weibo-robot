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
		function getUnread() {
			weibo.getUnread(this);
		},
		function getUnreadMentions(unread) {
			if (!unread || unread.mention_status == 0) {
				//return;
			}
			weibo.getMentions(3, this)
		},
		function sendReply(mentions) {
			if (!mentions || mentions.length == 0) {
				return;
			}
			for (var i = mentions.length - 1; i >= 0; i--) {
				var mention = mentions[i];
				var content=truncateContent(mention.text);
				var userWeiboId=mention.user.id;
				//insert content into db by user
				weibo.comment(mention.id, "已收藏~");
			};
			weibo.clearUnread();
		});

	function truncateContent(mention) {
		var result = /@\S+ (.+)/.exec(mention);
		if (result && result[1]) {
			return result[1];
		} else {
			return /(.+)@\S+/.exec(mention)[1];
		}
	}
}

checkMentions();