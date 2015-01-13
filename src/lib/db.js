var utils = lib_require("utils");

function EasyDb(config) {
    this.queries = [];
    this.successH = [];
    this.errorH = null;
    this.alwaysH = null;
	this.config = config;
    this.proxy = this.config.support.modProxy.createProxy();
    this.transaction = false;
    this.doneH = null;
	installQueryHandlers(this);
}

function installQueryHandlers(easyDb){
	var ops = easyDb.config.support.ops;
	for(var i=0;i<ops.length; i++){
		var currOp = ops[i];
		(function(op){
			easyDb[op] = function(queryParam){
				if (easyDb.successH.length < easyDb.queries.length){
					easyDb.successH.push(null);			
				}
				var param = queryParam;
				if(!utils.isFunction(queryParam)){
					 if(easyDb.queries.length > 0){
						throw new Error(sh.caller("Expecting a query generator function."));
					}
					param = Array.prototype.slice.call(arguments);
				}
				easyDb.queries.push({param: param, name: op});
				easyDb.lastCallWasQuery = true;
				return easyDb;
			}
		})(currOp);
	}
}

EasyDb.prototype.success = function (s) {
    this.successH.push(s);
    return this;
};

EasyDb.prototype.error = function (e) {
    this.errorH = e;
    return this;
};

EasyDb.prototype.always = function (a) {
    this.alwaysH = a;
    return this;
};

EasyDb.prototype.done = function (d) {
    this.doneH = d;
    return this;
};


EasyDb.prototype.clear = function () {
    if (this.alwaysH)
        this.alwaysH();
    this.config.pool.release(this.client);
    this.transaction = false;
    this.proxy.setClient(null);
};


EasyDb.prototype.cancel = function () {//cancel pending queries.
    this.queries = [];
    this.successH = [];
	this.clear();//ADDED
};

function _execute_queries(easyDb) {
    if (easyDb.queries.length == 0) {
        if (easyDb.transaction) {
            easyDb.proxy.commit(
                function (err, rows) {
                    if (err) {
                        logger.error("COMMIT failed: " + err);
                        easyDb.errorH(err);
                    } else {
                        if (easyDb.doneH)
                            easyDb.doneH();
                    }
                    easyDb.clear();
                }
            );
        } else {
            if (easyDb.doneH)
                easyDb.doneH();
            easyDb.clear();
        }
        return;
    }

    var queryInfo = easyDb.queries.shift();
	var queryParam = queryInfo.param;
	if(utils.isFunction(queryParam)){
		queryParam = queryParam();//generate the query
	}
	
	var callback = 
        function (err) {			
            if (err) {
                logger.error("Query failed: " + query.query + ", params: " + JSON.stringify(query.params) + " error: " + err);
                if (easyDb.errorH)
                    easyDb.errorH(err);
                _rollback_txn(easyDb);
            } else {
                var successF = easyDb.successH.shift();
                var proceed = true;					
                if (successF) {
                    try {
                        successF.apply(null, Array.prototype.slice.call(arguments, 1));
                    }
                    catch (e) {
                        if (easyDb.errorH)
                            easyDb.errorH(e);
                        _rollback_txn(easyDb);
                        proceed = false;
                    }
                }
                if (proceed) {
                    _execute_queries(easyDb);
                }
            }
        };
	var fnName = queryInfo.name;
	if(easyDb.proxy[fnName]){
		queryParam.push(callback);
		easyDb.proxy[fnName].apply(easyDb.proxy, queryParam);
	}else{
		easyDb.proxy.genericQuery(fnName, queryParam, callback);
	}    
}

function _rollback_txn(easyDb) {
    if (easyDb.transaction) {
        easyDb.transaction = false;
        easyDb.proxy.rollback(
            function (err, rows) {
                if (err) {
                    logger.error("cannot rollback transaction %s", err);
                }
                easyDb.clear();
            }
        );
    } else {
        easyDb.clear();
    }
}
EasyDb.prototype.execute = function (options) {
    if (!options)
        options = {};
    var easyDb = this;
    this.config.pool.acquire(
        function (err, client) {
            if (err) {
                sh.log.error("Cannot acquire pool instance for pool %s. Error: %s", this.pool.name, err);
                if (easyDb.errorH)
                    easyDb.errorH(err);
                easyDb.clear();
            }
            else {
                easyDb.proxy.setClient(client);
                easyDb.transaction = options.transaction ? options.transaction : false;
                if (easyDb.transaction) {
                    proxy.startTransaction(
                        function (err, rows) {
                            if (err) {
                                logger.error("Start transaction failed: %s", err);
                                if (easyDb.errorH)
                                    easyDb.errorH(err);
                                easyDb.clear();
                            } else {
								process.nextTick(function(){
									_execute_queries(easyDb);
								});
                            }
                        }
                    );
                } else
					process.nextTick(function(){
						_execute_queries(easyDb);
					});
            }
        }
    );
};

exports.get = function (name) {
	var config = shelloid.serverCtx.appCtx.config.databases[name];
	if(!config){
		throw new Error(sh.caller("Unknown DB name: " + name));
	}
    return new EasyDb(config);
};
