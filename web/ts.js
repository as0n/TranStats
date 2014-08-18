/* -- TODO
 * - barre de progression (téléchargé) animée : check github
 * - tri par dossier
 * - tri par tracker
 * - tri dynamique des colonnes
 * - historique d'envoi (quotidien, hebdo, ...)
 */

ts = (function() {
	var endpoint = "",
		exts = ["o", "ko", "Mo", "Go", "To"],
		speedExts = ["o/s", "ko/s", "Mo/s", "Go/s", "To/s"],
		table = $('#mainTable tbody'),
		loader = $("#loading"),
		menu = $("#menu"),
		tplTorrent = Handlebars.compile($('#tplTorLine').html()),
		tplMenu = Handlebars.compile($('#tplMenu').html()),
		targetRatio = 10,
		minTDOutput = 2*1024*1024*1024, //2Go
		data;

	$('#content').scroll(function() {
		var $t = $(this);
		$t.css("box-shadow", $t.scrollTop() > 1 ? "inset 0 0 10px black" : "none");
	});

	function round(x, n) {
		var p = Math.pow(10, n);
		return Math.round(x*p)/p;
	}

	function normSize(s, speed) {
		var i = 0;
		while (Math.abs(s) >= 1024*0.9) {
			s /= 1024;
			i++;
		}
		return round(s, 2) + " " + (speed ? speedExts[i] : exts[i]);
	}

	Handlebars.registerHelper('size', function(size) {
		return normSize(size);
	});
	Handlebars.registerHelper('speed', function(speed) {
		return normSize(speed, true);
	});
	Handlebars.registerHelper('ago', function(time) {
		var delta = round(new Date()/1000, 0) - time,
			secs = delta % 60,
			mins = ((delta - secs)/60)%60,
			hours = ((delta - secs - 60*mins)/3600)%24,
			days = (delta - secs - 60*mins - 3600*hours)/86400,
			lastActivity = [];
		if (days > 0) lastActivity.push(days);
		if (lastActivity.length > 0 || hours > 0) lastActivity.push(hours);
		if (lastActivity.length > 0 || mins > 0) lastActivity.push(mins);
		if (lastActivity.length > 0 || secs > 0) lastActivity.push(secs);
		for (var j = lastActivity.length-1; j>Math.max(0, lastActivity.length-4); j--) if (lastActivity[j] < 10) lastActivity[j] = "0"+lastActivity[j];
		return lastActivity.join(':');
	});
	Handlebars.registerHelper('colorRatio', function(ratio) {
		return typeof ratio === "number" ? genColorOffset(ratio, data.maxRatio, targetRatio) : genColor(1, 1, 1);
	});
	Handlebars.registerHelper('colorDiff', function(diff) {
		return genColor(diff, data.maxDiff, data.minDiff);
	});
	Handlebars.registerHelper('colorDeltaD', function(deltad) {
		return genColor(deltad, data.maxDD, 0);
	});
	Handlebars.registerHelper('colorDeltaTD', function(deltatd) {
		return genColorOffset(deltatd, data.maxDTD, minTDOutput);
	});
	Handlebars.registerHelper('fade', function(value, max) {
		var dt = (new Date().getTime())/1000 - value,
			Dt = max*24*60*60,
			res = round(dt/Dt, 2);
		return res;
	});
	Handlebars.registerHelper('progress', function(pct) {
		console.log(pct);
		if (pct >= 100) return;
		return "background : linear-gradient(to right, rgba(0,0,0,0.5) "+pct+"%, rgba(0,0,0,0) "+pct+"%)";
	});

	function genColor(val, maxValue, minValue) {
		function repart(x) {
			return 1 - Math.exp(-x*7);
		}
		var s = val >= 0 ? repart(val/maxValue) : repart(-val/minValue);
		return madcolor.color.fromHSV(val > 0 ? 120 : 0, s, 0.8);
	}
	function genColorOffset(val, max, mean) {
		return genColor(val-mean, max-mean, mean);
	}

	function conn(hashList, cb) {
		$.ajax({
			url : endpoint,
			type : "POST",
			dataType : "json",
			data : JSON.stringify(hashList)
		}).done(function(data) {
			cb(data);
		});
	}

	function update() {
		loader.show();
		conn([], function(incData) {
			data = incData;

			menu.html(tplMenu(data.session));

			$('tr.tor').remove();
			for (var key in data.torrents) table.append(tplTorrent(data.torrents[key]));

			loader.hide();
		});
	}

	setInterval(update, 10000);
	update();
})();