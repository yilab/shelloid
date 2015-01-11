var proxyBase = lib_require("proxy-base");
var support;

exports.init(supportThis){
	support = supportThis;
}

exports.createProxy(client){
	return new MysqlProxy(client);
}

exports.createPool = function(config){
	var mysql = support.mod;
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

function MysqlProxy(client){
	proxyBase.ProxyBase.call(this, client);
}

MysqlProxy.prototype = Object.create(proxyBase.ProxyBase.prototype);

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