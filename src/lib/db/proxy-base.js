var genericPool = require('generic-pool'),

exports.createPool = function(config, createFn, destroyFn){
	var pool = genericPool.Pool({
		name: config.name,
		create: createFn,
		destroy: destroyFn,
		max: config.maxConnections ? config.maxConnections : 50,
		min: config.minConnections ? config.minConnections : 2,
		idleTimeoutMillis: config.idleTimeoutMillis ? config.idleTimeoutMillis : 30000,
		log: config.log
	});
	return pool;
}

function ProxyBase(client){
	this.client = client;
}

ProxyBase.prototype.setClient(client){
	this.client = client;
}

ProxyBase.prototype.getClient(){
	return this.client;
}

ProxyBase.prototype.query(name, params, callback){
	params.push(callback);
	this.client[name].apply(null, params);
}

exports.ProxyBase = ProxyBase;

