var cluster = require("cluster");
var winston = require("winston");
 
shelloid.log = function(level, msg){
	if(cluster.isWorker){
		var msg = {isLog: true, logLevel: level, logMsg: msg};
		process.send(msg);
	}else{
		winston.log(level, msg);
	}
}

shelloid.info = function(msg){
	shelloid.log("info", msg);
}

shelloid.warn = function(msg){
	shelloid.log("warn", msg);
}

shelloid.error = function(msg){
	shelloid.log("error", sh.caller(msg));
}
