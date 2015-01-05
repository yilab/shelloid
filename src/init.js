var path = require("path");
var fs = require("fs");
var NeDB = require("nedb");
var assert = require("assert");

var utils = lib_require("utils");

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
};

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
			appCtx.config = utils.merge(appCtx.config, config);
			assert(config.dataDir !== undefined);
			config.absDataDir = utils.joinIfRelative(appCtx.basePath, config.dataDir);
			utils.mkdirIfNotExists(config.absDataDir, 
									"Data directory: " + config.dataDir + 
									"(" + config.absDataDir+ ") does not exist. Trying to create one.");
			
			if(!config.uploadsDir){
				config.uploadsDir = "uploads";
				config.adminUploadsDir = "admin-uploads";
			}			
			
			config.absUploadsDir = utils.joinIfRelative(config.absDataDir, config.uploadsDir);
			utils.mkdirIfNotExists(config.absUploadsDir, 
								"Uploads directory: " + config.uploadsDir + 
								"(" + config.absUploadsDir+ ") does not exist. Trying to create one.");

			config.absAdminUploadsDir = utils.joinIfRelative(config.absDataDir, config.adminUploadsDir);
			utils.mkdirIfNotExists(config.absAdminUploadsDir, 
							"Admin Uploads directory: " + config.adminUploadsDir + 
							"(" + config.absAdminUploadsDir+ ") does not exist. Trying to create one.");
								
			
		}catch(err){
			console.log("Error parsing config.json: " + configFile + " : " + err);
			process.exit(0);
		}
	}
}

exports.loadConfigDB = function(appCtx){
	var db = new NeDB({filename: appCtx.absDataDir + "/config.db", autoload: true});
	appCtx.configDB = db;
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
			dataDir : "data",
			/*computed at init time*/
			absDataDir: null,
			uploadsDir: null,
			absUploadsDir: null,
			adminUploadsDir: null,
			absAdminUploadsDir: null,
			configDB: null
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

