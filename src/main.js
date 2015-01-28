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

var path = require("path"),
	cluster = require("cluster"),
	os = require("os");
	winston = require('winston'),
	child_process = require("child_process");

/*require/init order is important*/
var	init = require("./init.js");

init.installGlobals();

var log = lib_require("log");
var extMgr = lib_require("extmgr");
var loader = lib_require("loader"),
	utils = lib_require("utils"),
	route = lib_require("route"),
	app   = lib_require("app"),
	auth = lib_require("auth"),
	app_pkg = lib_require("app_pkg"),
	dbconfig = lib_require("dbconfig"),
	autorestart = lib_require("autorestart");
	
if(process.argv.length <= 2){
    console.log("Please provide app directory as the argument");
	process.exit(0);
}

var args = process.argv.slice(2);

if(args[1] == "init"){
	var appInit = lib_require("appinit");
	args.unshift(path.resolve(__dirname, ".."));
	appInit.apply(null, args);
	return;
}

var envName = args[1];
if(envName && envName.startsWith("-")){
	envName = null;
}
var serverCtx = init.serverCtx(args[0], envName);
serverCtx.startTime = new Date();
serverCtx.startTimeMillis = serverCtx.startTime.valueOf();

shelloid.serverCtx = serverCtx;
shelloid.appCtx = serverCtx.appCtx;
shelloid.serverCtx.args = args;
init.loadAppConfig(serverCtx.appCtx);

var lastRestart = new Date().valueOf();
var isMon = args[1] !== "--nomon" && args[2] !== "--nomon";
var doRestart = true;

if(isMon){
	startMon();
}else{
	startServer();
}

function onChildExit(){
	if(!doRestart){
		console.log("Exiting server");
		process.exit(0);
	}
	init.loadAppConfig(serverCtx.appCtx);//reload app config
	var currTime = new Date().valueOf();
	var delta = currTime - lastRestart;
	delta = serverCtx.appCtx.config.autoRestart.thresholdMillis - delta;
	delta = delta < 0 ? 10 : delta;
	setTimeout(function(){
		console.log("Restarting server.");
		var child = child_process.fork(process.argv[1], args, {cwd: process.cwd(), silent:false});
		child.on("exit", onChildExit);
	}, delta);
}

function startMon(){
	console.log("Setting up the monitor process");
	args.push("--nomon");
	var child = child_process.fork(process.argv[1], args, 
		{cwd: process.cwd(), silent:false});
	child.on("exit", onChildExit);	
	var shutdownMon = function(){
		console.log("Shutting down monitor");
		doRestart = false;
	}	
	process.on ('SIGTERM', shutdownMon);
	process.on ('SIGINT', shutdownMon);
	process.on ('SIGHUP', shutdownMon);
}

function startServer(){
	var numCPUs = os.cpus().length;

	if(cluster.isMaster){
		winston.add(winston.transports.File, { filename: serverCtx.appCtx.config.log.file});
		winston.transports.Console.level = serverCtx.appCtx.config.log.level;
		winston.transports.File.level = serverCtx.appCtx.config.log.level;	
	}
		
	if (cluster.isMaster && serverCtx.appCtx.config.enableCluster) {	
		if(serverCtx.appCtx.env == "sim"){
			sh.error("Cannot enable cluster in simulator mode. Please set config.enableCluster to false");
			process.exit(0);
		}
		
		var shutdownWait = function(){
			sh.info("Cluster master is waiting for children to exit");
		}
		process.on ('SIGTERM', shutdownWait);
		process.on ('SIGINT', shutdownWait);
		process.on ('SIGHUP', shutdownWait);
		
		console.log("Enabling Cluster: Starting workers");
		cluster.setupMaster({ silent: false });
		// Fork workers.
		for (var i = 0; i < numCPUs; i++) {
			cluster.fork();
		}
		cluster.on('exit', function(worker, code, signal) {
			console.log('Worker: ' + worker.process.pid + ' died. Exit code: ' + code);
			if(sh.serverCtx.isRestarting){
				var keys = Object.keys(cluster.workers);
				if(keys.length == 0){
					process.exit(0);//shutdown the master.
				}
			}else{
				sh.info("Starting a new worker process to replace the died one.");
				cluster.fork();//respawn the cluster child.
			}			
		});
			
		for(var k in cluster.workers){
			var worker = cluster.workers[k];
			worker.on("message", processWorkerMsg);
		}
	}else{
		process.on ('SIGTERM', autorestart.gracefulShutdown);
		process.on ('SIGINT', autorestart.gracefulShutdown);
		process.on ('SIGHUP', autorestart.gracefulShutdown);

		app_pkg.init(serverCtx.appCtx, app_pkg_initDone);
	}

	if(cluster.isMaster){
		autorestart.init(serverCtx);	
	}	
}

function processWorkerMsg(msg){
	if(msg.isLog){
		winston.log(msg.logLevel, msg.logMsg);
	}else{
		console.log("Don't know how to process the worker message", msg);
	}
}

function app_pkg_initDone(err){
	if(err){
		console.log("Server initialization error: " + err + "Exiting.");
		process.exit(0);
	}else{
		sh.info("Application package manager initialization done.");	
		extMgr.loadExtensions(createAppInstance);
	}
}

function createAppInstance(){
	serverCtx.appCtx.app = app.newInstance(serverCtx.appCtx);
	dbInit();
}

function dbInit(){
	dbconfig.init(serverCtx, appInit);
}

function appInit(){
	init.appInit(loadAppMods);
}

function loadAppMods(){
	sh.info("Database initialization done");
	loader.loadAll(appModsLoaded);
}

function appModsLoaded(){		
	if(serverCtx.appCtx.authMods.length == 0){
		sh.info("No authentication modules found.");
		authModsAdded();
	}else{
		sh.info("Authentication modules loaded.");
		auth.addAll(serverCtx.appCtx, authModsAdded);
	}
}

function authModsAdded(){
	if(serverCtx.appCtx.env == "sim"){
		var sim = lib_require("sim");
		sim.init();
		addRoutes();
	}else{
		addRoutes();
	}
}

function addRoutes(){
	
	if(serverCtx.appCtx.routes.length == 0){
		console.log("No routes configured! Exiting.");
		process.exit();
	}

	route.addAll(serverCtx.appCtx);
	
	if(serverCtx.appCtx.hasErrors()){
		console.log("Application context has errors. Exiting.");
		process.exit(0);
	}
	var engine;
	var options = null;
	if(serverCtx.appCtx.config.https.enable){
		engine = require('https');
		options = httpsOptions(serverCtx.appCtx.config.https);		
	}else{
		engine = require("http");
	}
	var server = engine.createServer(serverCtx.appCtx.app, options);
	serverCtx.server = server;
	server.listen(serverCtx.appCtx.config.port, function(){
		shelloid.info('Shelloid server version: ' + 
					  serverCtx.packageJson.version + 
					' listening on ' + 	serverCtx.appCtx.config.port);
	});
}

function httpsOptions(c){
	var options = {passphrase: c.passphrase};
	if(c.key && c.pfx){
		sh.error("Https config: Please specify either key/cert files or a pfx file - not both.");
		process.exit(0);
	}
	
	if(c.key){
		if(!utils.fileExists(c.key)){
			sh.error("Https config: Key file does not exist: " + c.key);
			process.exit(0);				
		}
		if(!utils.fileExists(c.cert)){
			sh.error("Https config: Cert file does not exist: " + c.pfx);
			process.exit(0);			
		}
		options.key = fs.readFileSync(c.key);
		options.cert = fs.readFileSync(c.cert);
	}
	
	if(c.pfx){
		if(!utils.fileExists(c.pfx)){
			sh.error("Https config: PFX file does not exist: " + c.pfx);
			process.exit(0);			
		}
		options.pfx = fs.readFileSync(c.pfx);
	}
	
	if(c.ca){
		options.ca = [];
		for(var i=0;i<c.ca.length;i++){
			if(!utils.fileExists(c.ca[i])){
				sh.error("Https config: CA file does not exist: " + c.ca[i]);
				process.exit(0);
			}
			options.ca.push(fs.readFileSync(c.ca[i]));
		}
	}
	return options;
}