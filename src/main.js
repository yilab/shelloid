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
global.lib_require = require("./lib/lib_require.js");
global.sys_require = require("./lib/sys_require.js");//for app code to require Shelloid's node_modules

var http = require('http'),
	path = require("path");

/*require/init order is important*/

var	init = require("./init.js");

var loader = lib_require("loader"),
	utils = lib_require("utils"),
	route = lib_require("route"),
	app   = lib_require("app"),
	auth = lib_require("auth"),
	app_pkg = lib_require("app_pkg"),
	validate_globals = lib_require("validate_globals");
	
if(process.argv.length <= 2){
    console.log("Please provide app directory as the argument");
	process.exit(0);
}

var serverCtx = init.serverCtx(process.argv[2]);

init.loadAppConfig(serverCtx.appCtx);

app_pkg.init(serverCtx.appCtx, app_pkg_initDone);
sys_require(serverCtx);//initialize sys_require.

function app_pkg_initDone(err){
	if(err){
		console.log("Server initialization error. Exiting.");
		process.exit(0);
	}else{
		serverCtx.appCtx.app = app.newInstance(serverCtx.appCtx);
		loader.loadAuthMods(serverCtx, authModsLoaded);
	}
}

function authModsLoaded(){		
	if(serverCtx.appCtx.authMods.length == 0){
		console.log("No authentication modules found.");
	}else{
		auth.addAll(serverCtx.appCtx, authModsAdded);
	}
}

function authModsAdded(){
	loader.loadInterfaces(serverCtx, interfacesLoaded);
}

function interfacesLoaded(){
	loader.loadRoutes(serverCtx, routesLoaded);
}

function routesLoaded(){
	if(serverCtx.appCtx.routes.length == 0){
		console.log("No routes configured! Exiting.");
		process.exit();
	}

	route.addAll(serverCtx.appCtx);
	
	if(serverCtx.appCtx.hasErrors){
		console.log("Application context has errors. Exiting.");
		process.exit(0);
	}

	var server = http.createServer(serverCtx.appCtx.app);

	server.listen(serverCtx.appCtx.config.port, function(){
	  console.log('Shelloid server version: ' + serverCtx.packageJson.version + ' listening on ' + 
		serverCtx.appCtx.config.port);
	});
		
}
