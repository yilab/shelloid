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
var utils = lib_require("utils");
var obj = lib_require("obj");

exports.installGlobals = function(){
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};

	String.prototype.startsWith = function (str){
		return this.indexOf(str) == 0;
	};
	global.shelloid = {};
	global.sh = shelloid;
	shelloid.getDBConfig = function(dbname){
		return shelloid.serverCtx.appCtx.config.databases[dbname];
	}	
	obj.installGlobals();	
}

exports.loadAppConfig = function(appCtx){
	var suffix = (!appCtx.env || appCtx.env == "") ? ".json" : "." + appCtx.env + ".json";
	var configFile = appCtx.basePath + "/config" + suffix;

	if(utils.fileExists(configFile)){
		var configTxt = fs.readFileSync(configFile, "utf-8");
		try{
			var config = JSON.parse(configTxt);
		}catch(err){
			console.log("Error parsing config.json: " + configFile + " : " + err);
			process.exit(0);
		}
			
		var config = appCtx.config = utils.merge(appCtx.config, config);
		assert(config.dirs.data !== undefined);
		config.dirs._data = config.dirs.data;//save for later reference
		config.dirs.data = utils.joinIfRelative(appCtx.basePath, config.dirs.data);
		utils.mkdirIfNotExists(config.dirs.data, 
								"Data directory: " + config.dirs._data + 
								"(" + config.dirs.data+ ") does not exist. Trying to create one.");								
		config.dirs._uploads = config.dirs.uploads;
		config.dirs.uploads = utils.joinIfRelative(config.dirs.data, config.dirs.uploads);
		utils.mkdirIfNotExists(config.dirs.uploads, 
							"Uploads directory: " + config.dirs.uploads + 
							"(" + config.dirs.uploads+ ") does not exist. Trying to create one.");

		config.log._file = config.log.file;
		config.log.file = utils.joinIfRelative(config.dirs.data, config.log.file);
		
		config.baseUrl = config.proto + "://" + config.domain;
		if(!((config.port == 80 && config.proto == "http") && 
			(config.port == 443 && config.proto == "https"))){
			config.baseUrl = config.baseUrl + ":" + config.port;
		}
		
		var dateFormatInt = {"string": 0, "date": 1, "moment": 2};
		config.validate.req.dateFormatInt = dateFormatInt[config.validate.req.dateFormat];
		config.validate.res.dateFormatInt = dateFormatInt[config.validate.res.dateFormat];		
	}else{
		console.log("Application config file does not exist. Using defaults");
	}
}

exports.serverCtx = function(pathParam, envName){
	
	shelloid.envName = envName;
	
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
		basePath: path.normalize(path.join(__dirname, "/..")),
		pools:{
		},
		appCtx :{
			env: envName,
			hasErrors: false,
			basePath: appBasePath,
			packageJsonPath: appPackageJsonPath,
			packageJson: appPackageJson,
			packageJsonModified: false,
			routes: [],
			authMods : [],
			interfaces: {},
			app: null,
			folders:{
				routes: null,
				auth: null,
				interfaces:null
			},
			config: {
				viewEngine : "ejs",
				dirs : {
					routes: "src/routes", 
					auth: "src/auth",
					interfaces: "src/interfaces",
					pub: "src/public",
					views: "src/views",
					data: "data",
					uploads: "uploads",
					init: "src/init.js"
				},			
				enableCluster: false,
				domain: "localhost",
				proto: "http",
				port: 8080,
				baseUrl: null, //computed dynamically
				log:{
					file : "shelloid.log", //relative to data dir
					level: "verbose"
				},
				validate:{
					req:{
						dateFormat: "moment",//moment, date, string
						dateFormatInt: 2,//int values for faster runtime processing
										 //0: string, 1: date, 2: moment
						safeStrings: true
					},
					res: {
						dateFormat: "string",
						dateFormatInt: 0,
						safeStrings : true
					}
				},
				auth:{
					prefix: "/auth",
					successRedirect: "/home",
					failureRedirect: "/",
					facebook:{
						appId: null,
						appSecret: null
					},
					twitter:{
						consumerKey: null,
						consumerSecret: null
					}
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

exports.appInit = function(done){
	var initJs = utils.joinIfRelative(sh.serverCtx.appCtx.basePath, sh.serverCtx.appCtx.config.dirs.init);	
	sh.routeCtx = {config: sh.serverCtx.appCtx.config};
	if(utils.fileExists(initJs)){
		var init = require(initJs);
		if(utils.isFunction(init)){
			init(sh.routeCtx, done);
		}else{
			sh.error("The init script " + initJs + " must have a function assigned to module.exports");
			process.exit(0);
		}		
	}else{
		done();
	}
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

