/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

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

exports.serverCtx = function(pathParam){

	var appBasePath = checkAppBasePath(pathParam);

	var packageJsonPath = path.normalize(path.join(__dirname,  "/../package.json"));
	var packageJson = utils.readJsonFile(packageJsonPath, "Shelloid package.json");
	
	if(utils.isString(packageJson)){
		console.log(packageJson);//this is an error string
		process.exit(0);
	}
	var appPackageJsonPath = path.normalize(path.join(appBasePath,  "/package.json"));
	var appPackageJson = utils.readJsonFile(appPackageJsonPath, "Application package.json");
	if(utils.isString(appPackageJson)){
		console.log(appPackageJson);//this is an error string
		process.exit(0);
	}

	var ctx = 
	{
		packageJsonPath : packageJsonPath,
		packageJson: packageJson,
		constants : {
			routesDir: "routes", 
			authDir: "auth"
		},
		appCtx :{
			hasErrors: false,
			basePath: appBasePath,
			packageJsonPath: appPackageJsonPath,
			packageJson: appPackageJson,
			packageJsonModified: false,
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
				redirects:{
					authSuccess: "/home",
					authFailure: "/"
				},
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


function checkAppBasePath(pathParam){
	var basePath = path.resolve(pathParam);
	if(!utils.dirExists(basePath)){
		console.log("The provided path: " + pathParam + 
					" (resolves to " + basePath + ") is not a directory");
		process.exit(0);	
	}
	return basePath;
}
