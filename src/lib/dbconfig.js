/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var app_pkg = lib_require("app_pkg"),
	utils = lib_require("utils");

exports.init = function(serverCtx, done){
	shelloid.db = lib_require("db");
	shelloid.serverCtx.databaseSupport = databaseSupport;
	var types = [];
	var databases = serverCtx.appCtx.config.databases;
	for(var k in  databases){
		if(!databases.hasOwnProperty(k)){
			continue;
		}
		var type = databases[k].type;
		if(!types.indexOf(type) >= 0){
			if(databaseSupport[type]){
				types.push(type);
			}else{
				shelloid.log("Does not support database type: " + type + " specified in the config");
				serverCtx.appCtx.hasErrors = true;
			}
		}
	}
	if(types.length == 0 || serverCtx.appCtx.hasErrors){
		process.nextTick(done);
		return;
	}
	
	var dbModulesLoaded = function(){
		for(var k in  databases){
			if(!databases.hasOwnProperty(k)){
				continue;
			}
			var config = databases[k];
			var support = databaseSupport[config.type];
			config.support = support;
			config.pool = support.modProxy.createPool(config);			
		}
		done();
	}
	var barrier = utils.countingBarrier(types.length, dbModulesLoaded);
	
	for(var i=0;i<types.length;i++){
		var support = databaseSupport[types[i]];
		(function(supportThis, supportType){
			supportThis.type = supportType;
			app_pkg.require(supportThis.modName, supportThis.modVersion,
				function(mod){
					supportThis.mod = mod;
					supportThis.modProxy = lib_require("db/"+supportType + "-proxy");
					supportThis.modProxy.init(supportThis);
					sh.info("Database module type " + supportType + " loaded.");
					barrier.countDown();
				}
			);		
		})(support, types[i]);
	}
}

var databaseSupport = {
	"mysql" : {
		modName: "mysql",
		modVersion: "*",
		mod: null,//loaded dynamically
		modProxy: null,
		ops: ["query"]
	},
	"redis" : {
		modName: "redis",
		modVersion: "0.12.1",
		mod: null,//loaded dynamically
		modProxy: null,
		ops: ["setex", "select", "del", "keys", "set", "hset", "hkeys"]
	}
	
};


