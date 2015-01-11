var genericPool = require('generic-pool'),
var support;

exports.init(supportThis){
	support = supportThis;
}

exports.createProxy(client){
	return new RedisProxy(client);
}

exports.createPool = function(config){
	var redis = support.mode;
	var pool = genericPool.Pool({
		name: config.name,
		create: function (callback) {
			var client = redis.createClient(config.port, config.host);
			client.auth(config.password);
			client.on("error", function (err) {
				sh.error("Redis error for instance: " config.name + ": "  + err);
			});
			callback(null, client);
		},
		destroy: function (client) {
			client.quit();
		},
		max: config.maxConnections ? config.maxConnections : 100,
		min: config.minConnections ? config.minConnections : 2,
		idleTimeoutMillis: config.idleTimeoutMillis ? config.idleTimeoutMillis : 30000,
		log: config.log
	});
	return pool;
}

function RedisProxy(client){
	this.client = client;
}

RedisProxy.prototype.setClient(client){
	this.client = client;
}

RedisProxy.prototype.getClient(){
	return this.client;
}

RedisProxy.prototype.query(name, obj, callback){
	this.client[name](obj, callback);
}