var fs = require('fs'),
	data = fs.readFileSync("../settings.json", { encoding : "utf8" });

if (!data || data.length == 0) {
	console.log(err);
	return process.exit(1);
}

console.log("Settings loaded ...");
module.exports = JSON.parse(data);