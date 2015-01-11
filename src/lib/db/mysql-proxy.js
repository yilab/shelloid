var genericPool = require('generic-pool'),
var support;

exports.init(supportThis){
	support = supportThis;
}

exports.createProxy(client){
	return new MysqlProxy(client);
}

exports.createPool = function(config){
	var pool = genericPool.Pool({
		name: config.name,
		create: function (callback) {
			var c = support.mod.createConnection(
				{
					host: config.host,
					user: config.user,
					password: config.password,
					database: config.database,
					timezone: "+0000"
				});
			c.connect();
			callback(null, c);
		},
		destroy: function (client) {
			client.end();
		},
		max: config.maxConnections ? config.maxConnections : 50,
		min: config.minConnections ? config.minConnections : 2,
		idleTimeoutMillis: config.idleTimeoutMillis ? config.idleTimeoutMillis : 30000,
		log: config.log
	});
	return pool;
}

function MysqlProxy(client){
	this.client = client;
}

MysqlProxy.prototype.setClient(client){
	this.client = client;
}

MysqlProxy.prototype.getClient(){
	return this.client;
}

MysqlProxy.prototype.$startTransaction(callback){
    this.client.query("START TRANSACTION", callback);	
}

MysqlProxy.prototype.$commit(callback){
    this.client.query("COMMIT", callback);	
}

MysqlProxy.prototype.$rollback(callback){
    this.client.query("ROLLBACK", callback);	
}

MysqlProxy.prototype.$query(query, callback){
    this.client.query(query.query, query.params, callback);	
}

MysqlProxy.prototype.query(name, obj, callback){
	this.client[name](obj, callback);
}