# TranStats

A web interface for transmission-daemon.
Daily and hourly stats !

## Dependencies
 - [Node.js](http://nodejs.org/) & [npm](https://www.npmjs.org/)
 - [Python](https://www.python.org/)

## Installation
 - Clone the repository and `cd` into it
 - Modify `settings.json` depending on your configuration :
    - `rpc_addr`, `rpc_user`, `rpc_pass` : connection information to your transmission-daemon RPC server
    - `file_storage` : relative path to the file which will contain the data scrapped from transmission
    - `file_log` : relative path to the log file of the scrapper
    - `time_limit` : how long (in seconds) to keep the scrapped data from transmission
 - run `./install.sh` to generate the above files and register the scrapping cron job.
 - cd into `server` and run `npm install` (you might need to sudo) to collect the server dependencies.
 - still in the `server` directory, run `node server.js` to launch the aggregation server (you might want to use [forever](https://github.com/nodejitsu/forever) for this one), it listens to port 8004.
 - make the `web` directory and the aggregation server accessible online (depending on your http server).
 - change the first var declaration of `web/ts.js` to **your** aggregation server endpoint.

## Features
 - [Awesome background](https://github.com/as0n/madcolor) !