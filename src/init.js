var path = require("path");
var fs = require("fs");
var assert = require("assert");

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
};

var utils = lib_require("utils");

exports.checkAndSetAppPath = function(pathParam, appCtx){
	appCtx.basePath = path.resolve(pathParam);
	if(!utils.dirExists(appCtx.basePath)){
		console.log("The provided path: " + pathParam + " (resolves to " + 
						appCtx.basePath + ") is not a directory");
		process.exit(0);	
	}
	app_require(appCtx.basePath, true);	
}

exports.loadAppConfig = function(appCtx){
	var configFile = appCtx.basePath + "/" + "config.json";

	if(utils.fileExists(configFile)){
		var configTxt = fs.readFileSync(configFile, "utf-8");
		try{
			var config = JSON.parse(configTxt);
		}catch(err){
			console.log("Error parsing config.json: " + configFile + " : " + err);
			process.exit(0);
		}
			
		var config = appCtx.config = utils.merge(appCtx.config, config);
		assert(config.dataDir !== undefined);
		config._dataDir = config.dataDir;//save for later reference
		config.dataDir = utils.joinIfRelative(appCtx.basePath, config.dataDir);
		utils.mkdirIfNotExists(config.dataDir, 
								"Data directory: " + config._dataDir + 
								"(" + config.dataDir+ ") does not exist. Trying to create one.");								
		config._uploadsDir = config.uploadsDir;
		config.uploadsDir = utils.joinIfRelative(config.dataDir, config.uploadsDir);
		utils.mkdirIfNotExists(config.uploadsDir, 
							"Uploads directory: " + config.uploadsDir + 
							"(" + config.uploadsDir+ ") does not exist. Trying to create one.");
			
	}
}

exports.serverCtx = function(){
	var packageJson = readPackageJson();
	var ctx = 
	{
		packageJson: packageJson,
		constants : {
			routesDir: "routes", 
			authDir: "auth"
		},
		appCtx :{
			routes: [],
			authMods : [],
			folders: {
				routes: null,
				authMods: null
			},
			app: null,
			config: {
				port: 8080,
				dataDir : "data",
				uploadsDir : "uploads", //relative to dataDir
				authBase : "auth",
				session:
				{
					name: "connect.sid",
					secret: "secret",
					store : null,/*defaults to in-memory store. else give name of the database*/
				},
				databases:
				{
					/*database name => 
					{type (mongodb, redis, mysql), host, port, username, password, other params}
					*/
				}
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

