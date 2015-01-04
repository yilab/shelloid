#! /usr/bin/env node

/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
 
var express = require('express'),
    http = require('http'),
	path = require("path"),
	fs = require("fs");

global.app_require = require("./lib/app_require.js");
global.lib_require = require("./lib/lib_require.js");

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
};
	
var loader = lib_require("loader"),
	utils = lib_require("utils");
	
var packageJsonFile = __dirname + "/../package.json";
var packageJson = {};

if(utils.fileExists(packageJsonFile)){
	var txt = fs.readFileSync(packageJsonFile, "utf-8");
	try{
		packageJson = JSON.parse(txt);
	}catch(err){
		console.log("Error parsing Shelloid package.json: " + packageJsonFile + " : " + err);
		process.exit(0);
	}
}
	
var serverCtx = {
	packageJson: packageJson,
	constants : {
		controllerDir: "routes", 
		authDir: "auth"
	},
	globals: {
		app: null
	},
	appCtx :{
		controllers: {}
	},
	config: {
		app : {
			port: 8080
		},
		server: {
			port: 9090
		}	
	}
};

if(process.argv.length <= 2){
    console.log("Please provide app directory as the argument");
	process.exit(0);
}

serverCtx.appCtx.basePath = path.resolve(process.argv[2]);

if(!utils.dirExists(serverCtx.appCtx.basePath)){
    console.log("The provided path: " + process.argv[2] + " (resolves to " + 
					serverCtx.appCtx.basePath + ") is not a directory");
	process.exit(0);	
}

app_require(serverCtx.appCtx.basePath, true);

var configFile = serverCtx.appCtx.basePath + "/" + "config.json";

if(utils.fileExists(configFile)){
	var configTxt = fs.readFileSync(configFile, "utf-8");
	try{
		var config = JSON.parse(configTxt);
		serverCtx.config = utils.merge(serverCtx.config, config);
	}catch(err){
		console.log("Error parsing config.json: " + configFile + " : " + err);
		process.exit(0);
	}
}

var app = express();
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(app.router);

var adminApp = express();
adminApp.use(express.cookieParser());
adminApp.use(express.bodyParser());
adminApp.use(app.router);
adminApp.use(express.static(path.join(__dirname, 'public')));

serverCtx.globals.app = app;
loader.loadControllers(serverCtx, loadingDone);

function addRoute(app, url, ctrl){
	var urlPath = url;
	if(ctrl.annotations["path"]){
		urlPath = ctrl.annotations["path"];
	}else if(ctrl.annotations["pathSuffix"]){
		var pathSuffix = ctrl.annotations["pathSuffix"];
		if(pathSuffix.startsWith("/")){
			urlPath = urlPath + pathSuffix;
		}else{
			urlPath = urlPath + "/" + pathSuffix;
		}
	}
	var method = "all";
	if(ctrl.annotations["method"]){
		method = ctrl.annotations["method"];
	}
	
	if(method.constructor == Array){
		for(var i=0;i<method.length;i++){
			console.log("Mounting " + ctrl.relPath + 
						" (" + ctrl.fnName + ") at " + urlPath + " (" + method[i] + ")");		
			app[method[i]](urlPath, ctrl.fn);
		}
	}else{
		console.log("Mounting " + ctrl.relPath + 
					" (" + ctrl.fnName + ") at " + urlPath + " (" + method + ")");
		app[method](urlPath, ctrl.fn);
	}
}

function loadingDone(){
	var controllers = serverCtx.appCtx.controllers;
	var count = 0;
	for(url in controllers){
		if(controllers.hasOwnProperty(url)){
			addRoute(app, url, controllers[url]);
		}
		count++;
	}
	if(count == 0){
		console.log("No controllers configured! Exiting.");
		process.exit();
	}
	//TODO configure routes.
	var server = http.createServer(app);

	server.listen(config.app.port, function(){
	  console.log('Shelloid server version: ' + serverCtx.packageJson.version + ' listening');
	});
	
	var adminServer = http.createServer(adminApp);

	adminServer.listen(config.admin.port, function(){
	  console.log('Shelloid admin Server listening');
	});
	
}
