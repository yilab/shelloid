var cluster = require("cluster");
shelloid.log = function(level, msg){
	if(cluster.isWorker){
		var msg = {isLog: true, logLevel: level, logMsg: msg};
		process.send(msg);
	}else{
		winston.log(msg.logLevel, msg.logMsg);
	}
}

shelloid.info = function(msg){
	shelloid.log("info", msg);
}

shelloid.warn = function(msg){
	shelloid.log("warn", msg);
}

shelloid.error = function(msg){
	shelloid.log("error", msg);
}
