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
global.app_require = require("./lib/app_require.js");

var http = require('http'),
	path = require("path");

/*require/init order is important*/

var	init = require("./init.js");

var loader = lib_require("loader"),
	utils = lib_require("utils"),
	route = lib_require("route"),
	app   = lib_require("app"),
	auth = lib_require("auth");
	
if(process.argv.length <= 2){
    console.log("Please provide app directory as the argument");
	process.exit(0);
}

var serverCtx = init.serverCtx(process.argv[2]);

init.loadAppConfig(serverCtx.appCtx);

var appObj = serverCtx.appCtx.app = app.newInstance(serverCtx.appCtx);

loader.loadAuthMods(serverCtx, authModsLoaded);

function authModsLoaded(){	
	
	var count = auth.addAll(serverCtx.appCtx);
	
	if(count == 0){
		console.log("No authentication modules configured!.");
	}
	
	loader.loadRoutes(serverCtx, routesLoaded);
}

function routesLoaded(){
	var count = route.addAll(serverCtx.appCtx);
	if(count == 0){
		console.log("No routes configured! Exiting.");
		process.exit();
	}
	
	if(serverCtx.appCtx.hasErrors){
		console.log("Application context has errors. Exiting.");
		process.exit(0);
	}

	var server = http.createServer(appObj);

	server.listen(serverCtx.appCtx.config.port, function(){
	  console.log('Shelloid server version: ' + serverCtx.packageJson.version + ' listening');
	});
		
}
