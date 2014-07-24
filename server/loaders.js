var request = require('request'),
	fs = require('fs'),
	settings = require('./settings.js');

/* torrents = {
 *		"a1b2c3" : {
 *			[...],
 *			hour : {
 *				time : 012345,
 *				value : 67890	
 *			},
 *			day : {
 *				time : 012345,
 *				value : 67890	
 *			}
 *		},
 *		[...]
 */
var torrents = {},
	session = {},
	hdrs = {},
	maxRatio, minDiff, MaxDiff, maxDH, maxDD, maxDTD;

function round(x, n) {
	var p = Math.pow(10, n);
	return Math.round(x*p)/p;
}

function connRpc(method, args, cb) {
	var tag = Math.round(Math.random()*10000);

	request.post({
		url : settings['rpc_addr'],
		method : "POST",
		headers : hdrs,
		body : JSON.stringify({
			method : method,
			arguments : args,
			tag : tag
		}),
		auth : {
			user : settings['rpc_user'],
			pass : settings['rpc_pass']
		},
		json : true
	}, function(err, response, body) {
		if (err) console.log(err);

		if (response.statusCode == 409) {
			var sid = response.headers["x-transmission-session-id"];
			//console.log("Switching to sid "+sid);
			hdrs["X-Transmission-Session-Id"] = sid;
			return connRpc(method, args, cb);
		}
		
		if (body.tag == tag) cb(body.arguments);
	});
}

function loadFromRpc() {
	connRpc("torrent-get", {
		fields : ["id", "name", "totalSize", "downloadedEver", "uploadedEver", "activityDate", "downloadDir", "rateDownload", "rateUpload", "status", "hashString"]
	}, function(data) {
		var tor, hash;

		maxRatio = 0;
		minDiff = 0;
		maxDiff = 0;
		maxDH = 0;
		maxDD = 0;
		maxDTD = 0;

		for (var i = 0; i<data.torrents.length; i++) {
			tor = data.torrents[i];
			hash = tor.hashString.substring(0, 6);

			torrents[hash] = torrents[hash] || {};
			for (var key in tor) torrents[hash][key] = tor[key];

			// More fields :
			torrents[hash].active = tor.status == 4 || tor.status == 6;
			torrents[hash].hash = hash;
			torrents[hash].pct = round(tor.downloadedEver*100/tor.totalSize, 2);
			torrents[hash].diff = tor.uploadedEver - tor.downloadedEver;
			torrents[hash].ratio = tor.downloadedEver > 0 ? round(tor.uploadedEver / tor.downloadedEver, 2) : "+ &infin;";
			torrents[hash].altRatio = round(tor.uploadedEver / tor.totalSize, 2);
			torrents[hash].deltaH = tor.uploadedEver - torrents[hash].hour.value;
			torrents[hash].deltaD = tor.uploadedEver - torrents[hash].day.value;
			torrents[hash].deltaTD = tor.uploadedEver - torrents[hash].tday.value;

			if (typeof torrents[hash].ratio === "number") maxRatio = Math.max(maxRatio, torrents[hash].ratio);
			maxDiff = Math.max(maxDiff, torrents[hash].diff);
			minDiff = Math.max(minDiff, -torrents[hash].diff);
			maxDH = Math.max(maxDH, torrents[hash].deltaH);
			maxDD = Math.max(maxDD, torrents[hash].deltaD);
			maxDTD = Math.max(maxDTD, torrents[hash].deltaTD);
		}
	});
}

function sessionRpc() {
	connRpc("session-stats", {}, function(data) {
		session = data;
	});
}

function loadFromLog() {
	fs.readFile("../scrap/"+settings['file_storage'], "utf8", function(err, data) {
		if (err) {
			console.log(err);
			return res.status(500).send(err);
		}

		var lines = data.split('\n'),
			now = new Date()/1000,
			hourAgo = now - 36000,
			dayAgo = now - 86400,
			tenDaysAgo = now - 864000,
			words,
			time, hash, value;

		for (var i = 0; i<lines.length; i++) {
			words = lines[i].split('|');
			time = parseInt(words[0]);
			hash = words[1];
			value = parseInt(words[2]);

			if (hash === undefined) continue;

			torrents[hash] = torrents[hash] || {};
			if (!torrents[hash].hour || Math.abs(hourAgo - time) < Math.abs(hourAgo - torrents[hash].hour.time)) torrents[hash].hour = {
				time : time,
				value : value
			}
			if (!torrents[hash].day || Math.abs(dayAgo - time) < Math.abs(dayAgo - torrents[hash].day.time)) torrents[hash].day = {
				time : time,
				value : value
			}
			if (!torrents[hash].tday || Math.abs(tenDaysAgo - time) < Math.abs(tenDaysAgo - torrents[hash].tday.time)) torrents[hash].tday = {
				time : time,
				value : value
			}

			torrents[hash].deltaH = torrents[hash].uploadedEver - torrents[hash].hour.value;
			torrents[hash].deltaD = torrents[hash].uploadedEver - torrents[hash].day.value;
			torrents[hash].deltaTD = torrents[hash].uploadedEver - torrents[hash].tday.value;

			maxDH = Math.max(maxDH, torrents[hash].deltaH);
			maxDD = Math.max(maxDD, torrents[hash].deltaD);
			maxDTD = Math.max(maxDTD, torrents[hash].deltaTD);
		}
	});
}

module.exports = {
	updateRpc : loadFromRpc,
	updateLog : loadFromLog,
	updateSession : sessionRpc,
	pack : function(hashList) {
		var res = {};
		if (hashList && hashList.length > 0) {
			for (var i = 0; i<hashList.length; i++) res[hashList[i]] = torrents[hashList[i]];
		} else res = torrents;

		return {
			torrents : res,
			session : session,
			maxRatio : maxRatio,
			minDiff : minDiff,
			maxDiff : maxDiff,
			maxDH : maxDH,
			maxDD : maxDD,
			maxDTD : maxDTD
		};
	}
}