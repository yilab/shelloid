var support;
var proxyBase = lib_require("db/proxy-base");

exports.init(supportThis){
	support = supportThis;
}

exports.createProxy(client){
	return new RedisProxy(client);
}

exports.ops = ["setex", "select", "del" , "keys"];

exports.createPool = function(config){
	var redis = support.mode;

	var createFn = 	function (callback) {
		var client = redis.createClient(config.port, config.host);
		client.auth(config.password, function(err){
			callback(err, client);
		});
		client.on("error", function (err) {
			sh.log.error(sh.loc("Redis error for instance: " config.name + ": "  + err));
		});
	};

	var destroyFn = function (client) {
		client.quit();
	};
	
	return proxyBase.createPool(config, createFn, destroyFn);
}

function RedisProxy(client){
	this.client = client;
}

RedisProxy.prototype = Object.create(proxyBase.ProxyBase.prototype);
