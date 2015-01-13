var app_pkg = lib_require("app_pkg"),
	utils = lib_require("utils");

exports.init = function(serverCtx, done){
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
					supportThis.modProxy.init(support);
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
		modProxy: null
	},
	"redis" : {
		modName: "redis",
		modVersion: "0.12.1",
		mod: null,//loaded dynamically
		modProxy: null
	}
	
};

shelloid.db = lib_require("db");
