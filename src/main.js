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
 
var http = require('http'),
	path = require("path");

/*require/init order is important*/

global.app_require = require("./lib/app_require.js");
global.lib_require = require("./lib/lib_require.js");

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
init.loadConfigDB(serverCtx.appCtx);

var userApp = app.newInstance(
			path.join(serverCtx.appCtx.basePath, 'public'), 
			'key1', 
			serverCtx.appCtx.absUploadsDir);
var adminApp = app.newInstance(
		path.join(__dirname, 'public'), 
		'key2',
		serverCtx.appCtx.absAdminUploadsDir);

serverCtx.globals.userApp = userApp;
serverCtx.globals.adminApp = adminApp;

loader.loadControllers(serverCtx, loadingDone);

function loadingDone(){
	var controllers = serverCtx.appCtx.controllers;
	var count = 0;
	for(url in controllers){
		if(controllers.hasOwnProperty(url)){
			route.add(userApp, url, controllers[url]);
		}
		count++;
	}
	if(count == 0){
		console.log("No controllers configured! Exiting.");
		process.exit();
	}

	var server = http.createServer(userApp);

	server.listen(serverCtx.appCtx.config.app.port, function(){
	  console.log('Shelloid server version: ' + serverCtx.packageJson.version + ' listening');
	});
	
	var adminServer = http.createServer(adminApp);

	adminServer.listen(serverCtx.appCtx.config.admin.port, function(){
	  console.log('Shelloid admin Server listening');
	});
	
}
