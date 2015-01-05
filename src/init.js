var path = require("path");
var fs = require("fs");
var utils = lib_require("utils");
var assert = require("assert");

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
};

exports.checkAndSetAppPath = function(pathParam, serverCtx){
	serverCtx.appCtx.basePath = path.resolve(pathParam);
	if(!utils.dirExists(serverCtx.appCtx.basePath)){
		console.log("The provided path: " + pathParam + " (resolves to " + 
						serverCtx.appCtx.basePath + ") is not a directory");
		process.exit(0);	
	}
	app_require(serverCtx.appCtx.basePath, true);	
}

exports.loadAppConfig = function(serverCtx){
	var configFile = serverCtx.appCtx.basePath + "/" + "config.json";

	if(utils.fileExists(configFile)){
		var configTxt = fs.readFileSync(configFile, "utf-8");
		try{
			var config = JSON.parse(configTxt);
			serverCtx.appCtx.config = utils.merge(serverCtx.appCtx.config, config);
			assert(config.dataDir !== undefined);
			if(utils.isAbsolutePath(config.dataDir)){
				config.absDataDir = config.dataDir;
			}else{
				config.absDataDir = path.normalize(path.join(serverCtx.appCtx.basePath, config.dataDir));
			}
			if(!utils.dirExists(config.absDataDir)){
				console.log("Data directory: " + config.dataDir + 
							"(" + config.absDataDir+ ") does not exist. Trying to create one.");
				fs.mkdirSync(config.absDataDir);
			}
		}catch(err){
			console.log("Error parsing config.json: " + configFile + " : " + err);
			process.exit(0);
		}
	}
}

exports.loadConfigDB = function(){

}

exports.serverCtx = function(){
	var packageJson = readPackageJson();
	var ctx = 
	{
		packageJson: packageJson,
		constants : {
			controllerDir: "routes", 
			authDir: "auth"
		},
		globals: {
			app: null
		},
		appCtx :{
			controllers: {},
			config: {
			app : {
				port: 8080
			},
			server: {
				port: 9090
			},
			dataDir : "data"
		}
			
		},
	};
	
	return ctx;
}

function readPackageJson(){
	var packageJsonFile = __dirname + "/../package.json";
	if(utils.fileExists(packageJsonFile)){
		var txt = fs.readFileSync(packageJsonFile, "utf-8");
		try{
			packageJson = JSON.parse(txt);
		}catch(err){
			console.log("Error parsing Shelloid package.json: " + packageJsonFile + " : " + err);
			process.exit(0);
		}
		return packageJson;
	}else{
		console.log("Couldn't find Shelloid package.json: " + packageJsonFile);
		process.exit(0);
	}
}

