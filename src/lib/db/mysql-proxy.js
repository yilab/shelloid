var proxyBase = lib_require("db/proxy-base");
var support;

exports.init = function(supportThis){
	support = supportThis;
}

exports.createProxy = function(client){
	return new MysqlProxy(client);
}

exports.createPool = function(config){
	var mysql = support.mod;
	config.port = config.port ? config.port : 3306;
	config.host = config.host ? config.host : "localhost";	
	var createFn = 	function (callback) {
		var c = mysql.createConnection(
			{
				host: config.host,
				user: config.user,
				password: config.password,
				database: config.database,
				timezone: "+0000"
			}
		);
		c.connect();
		callback(null, c);
	};

	var destroyFn = function (client) {
			client.end();
	};
	
	return proxyBase.createPool(config, createFn, destroyFn);
}

exports.ops = ["startTransaction", "commit", "rollback", "query"];

function MysqlProxy(client){
	proxyBase.ProxyBase.call(this, client);
}

MysqlProxy.prototype = Object.create(proxyBase.ProxyBase.prototype);

MysqlProxy.prototype.startTransaction = function(callback){
    this.client.query("START TRANSACTION", callback);	
}

MysqlProxy.prototype.commit = function(callback){
    this.client.query("COMMIT", callback);	
}

MysqlProxy.prototype.rollback = function(callback){
    this.client.query("ROLLBACK", callback);	
}