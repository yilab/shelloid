var support;

exports.init(supportThis){
	support = supportThis;
}

exports.createProxy(client){
	return new RedisProxy(client);
}

exports.createPool = function(config){
	var redis = support.mode;
	var createFn = 	function (callback) {
		var client = redis.createClient(config.port, config.host);
		client.auth(config.password);
		client.on("error", function (err) {
			sh.log.error(sh.loc("Redis error for instance: " config.name + ": "  + err));
		});
		callback(null, client);
	};

	var destroyFn = function (client) {
		client.quit();
	};
	
	return proxyBase.createPool(config, createFn, destroyFn);
}

function RedisProxy(client){
	this.client = client;
}