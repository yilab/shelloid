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
	app   = lib_require("app");
	
var serverCtx = init.serverCtx();

if(process.argv.length <= 2){
    console.log("Please provide app directory as the argument");
	process.exit(0);
}

init.checkAndSetAppPath(process.argv[2], serverCtx.appCtx);
init.loadAppConfig(serverCtx.appCtx);

var app = app.newInstance(serverCtx.appCtx);

serverCtx.appCtx.app = app;

loader.loadAuthMods(serverCtx, authModsLoaded);

function authModsLoaded(){
	var authMods = serverCtx.appCtx.authMods;
	var count = 0;
	for(var i=0;i < authMods.length; i++){
		console.log(authMods[i]);
		count++;
	}
	if(count == 0){
		console.log("No authentication modules configured!.");
	}
	
	loader.loadRoutes(serverCtx, routesLoaded);
}

function routesLoaded(){
	var routes = serverCtx.appCtx.routes;
	var count = 0;
	for(var i=0;i < routes.length; i++){
		route.add(app, routes[i]);
		count++;
	}
	if(count == 0){
		console.log("No routes configured! Exiting.");
		process.exit();
	}

	var server = http.createServer(app);

	server.listen(serverCtx.appCtx.config.port, function(){
	  console.log('Shelloid server version: ' + serverCtx.packageJson.version + ' listening');
	});
		
}
