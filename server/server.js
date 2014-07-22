var express = require('express'),
	comp = require('compression'),
	bodyParser = require('body-parser'),
	morgan = require('morgan'),
	loaders = require('./loaders.js');

var app = express();

app.use(morgan("combined"));
app.use(comp());
app.use(bodyParser.json());

setInterval(loaders.updateRpc, 10*1000);
setInterval(loaders.updateLog, 30*60*1000);
setInterval(loaders.updateSession, 10*1000);
loaders.updateRpc();
loaders.updateSession();
loaders.updateLog();

app.post('/', function(req, res, next) {
	return res.json(loaders.pack(req.body.hash));
});

app.listen(8004, "localhost");