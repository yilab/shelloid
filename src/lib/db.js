/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var utils = lib_require("utils");

function EasyDb(config, parentDomain) {
    this.queries = [];
    this.successH = [];
    this.errorH = null;
    this.finallyH = null;
	this.config = config;
    this.proxy = this.config.support.modProxy.createProxy();
    this.transaction = false;
    this.doneH = null;
	this.firstQuery = true;
	this.parentDomain = parentDomain;
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
					 if(!easyDb.firstQuery){
						throw new Error(sh.caller("Expecting a query generator function."));
					}
					easyDb.firstQuery = false;
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

EasyDb.prototype.finally = function (a) {
    this.finallyH = a;
    return this;
};

EasyDb.prototype.done = function (d) {
    this.doneH = d;
    return this;
};


EasyDb.prototype.clear = function () {
    if (this.finallyH)
        this.finallyH();
	var client = this.proxy.getClient();
	if(client){
		this.config.pool.release(client);
	}
    this.transaction = false;
    this.proxy.setClient(null);
	this.firstQuery = true;
};


EasyDb.prototype.cancel = function () {//cancel pending queries.
    this.queries = [];
    this.successH = [];
	this.clear();//ADDED
	return this;
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
                if (successF) {
                    successF.apply(null, Array.prototype.slice.call(arguments, 1));
                }
                _execute_queries(easyDb);
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

EasyDb.prototype.execute = function(options){
	var easydb = this;
	var d = require('domain').create();
	d.add(easydb);
	d.on('error', function(er) {	
		_rollback_txn(easydb);
        if (easydb.errorH){
			easydb.errorH(er);
		}
		if(easydb.parentDomain){
			easydb.parentDomain.emit('error', er);
		}
	});
	d.run(function(){
		easydb.executeImpl();
	});	
}

EasyDb.prototype.executeImpl = function (options) {
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

module.exports = function (name, parentDomain) {
	var config = shelloid.serverCtx.appCtx.config.databases[name];
	if(!config){
		throw new Error(sh.caller("Unknown DB name: " + name));
	}
    return new EasyDb(config, parentDomain);
};
