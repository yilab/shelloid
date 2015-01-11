function EasyDb(config) {
    this.queries = [];
    this.successH = [];
    this.errorH = null;
    this.alwaysH = null;
	this.config = config;
    this.proxy = this.config.support.createProxy();
    this.transaction = false;
    this.doneH = null;
	installQueryHandlers(this);
}

function void installQueryHandlers(easyDb){
    easyDb.config = config;	
	for(var k in easyDb.proxy){
		if(this.proxy.hasOwnProperty(k) && k.startsWith("$")){
			var fn = easyDb.proxy[k];
			var fName = k.substring(1);
			this[fName] = function(genFn){
				if (easyDb.successH.length < easyDb.queries.length){
					easyDb.successH.push(null);			
				}
				easyDb.queries.push({gen: genFn, name: fName});
				easyDb.lastCallWasQuery = easyDb;
				return easyDb;
			}
		}
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

    var queryF = easyDb.queries.shift();
    var query = queryF.gen(); //generate query
	var callback = 
        function (err, res) {
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
                        successF(res);
                    }
                    catch (e) {
                        if (easyDb.errorH)
                            easyDb.errorH(e.message);
                        _rollback_txn(easyDb);
                        proceed = false;
                    }
                }
                if (proceed) {
                    _execute_queries(easyDb);
                }
            }
        };
	var queryFn = easyDb.proxy[queryF.name);
	if(queryFn){
		easyDb.proxy[queryF.name](query, callback);
	}else{
		easyDb.proxy.query(queryF.name, query, callback);
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
                                _execute_queries(easyDb);
                            }
                        }
                    );
                } else
                    _execute_queries(easyDb);
            }
        }
    );
};

module.exports = function (name) {
	var config = shelloid.serverCtx.appCtx.config.databases[name];
	if(!config){
		throw new Error(sh.caller("Unknown DB name: " + name));
	}
    return new EasyDb(config);
};
