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
var utils = lib_require("utils");
var annotation = lib_require("annotation");

exports.loadRoutes = function(serverCtx, done)
{
	var p = utils.joinIfRelative(serverCtx.appCtx.basePath, serverCtx.appCtx.config.dirs.routes);
	p = path.normalize(p);
	serverCtx.appCtx.folders.routes = p;	
	loadModules(serverCtx, p, "route", serverCtx.appCtx.routes, done);
}

exports.loadAuthMods = function(serverCtx, done)
{
	var p = utils.joinIfRelative(serverCtx.appCtx.basePath, serverCtx.appCtx.config.dirs.auth);
	p = path.normalize(p);
	serverCtx.appCtx.folders.authMods = p;	
	loadModules(serverCtx, p, "auth", serverCtx.appCtx.authMods, done);
}

exports.loadInterfaces = function(serverCtx, done)
{
	var p = utils.joinIfRelative(serverCtx.appCtx.basePath, serverCtx.appCtx.config.dirs.interfaces);
	p = path.normalize(p);
	serverCtx.appCtx.folders.interfaces = p;	
	loadModules(serverCtx, p, "interface", serverCtx.appCtx.interfaces, done);
}

function loadModules(serverCtx, modPath, modType, mods, done){	
	if(!utils.dirExists(modPath)){
		console.log("The " + modType + " folder does not exist: " + modPath);
		process.nextTick(done);
		return;		
	}	
	var modPathLength = modPath.length;
	var files = utils.recurseDirSync(modPath);
	var barrier = utils.countingBarrier(files.length, done);
	
	for(var i=0;i<files.length;i++){
		if(files[i].path.endsWith(".js")){
			console.log("Processing: " + files[i].path + " (" + modType + ")" );
			annotation.parseAnnotations(serverCtx, files[i],  
				function(pathInfo, annotations){
					if(!annotations){
						annotations = {};
					}
					var url = pathToURL(pathInfo.path, modPathLength);			
					var m = require(pathInfo.path);
					for(f in m){
						if(m.hasOwnProperty(f)){
							if(f != "index"){
								url = url + "/" + f;
							}
							if(!annotations[f]){
								annotations[f] = {};
							}
							if(!annotations[f].ignore){
								var mod = 
									{
										type: modType,
										fn: m[f],
										fnName: f,
										annotations: annotations[f],
										path: pathInfo.path,
										relPath : pathInfo.relPath,
										url: url
									};
								if(modType == "interface"){
									mods[mod.relPath + "/" + f] = mod;
								}else{
									mods.push(mod);
								}
							}else{
								console.log("Ignoring app module with @ignore: " + 
																pathInfo.relPath + " (" + f + ")");
							}
						}
					}
					barrier.countDown();
				}
			);
		}else{
			barrier.countDown();
		}
	}
}

function pathToURL(path, basePathLength){
	var relPath = path.substring(basePathLength);//remove base path
	var url = relPath.replace(/\\/g, "/");
	var re = url.endsWith("index.js") ?  new RegExp("/?index.js$") : new RegExp("\.js?");
	url = url.replace(re, "");
	if(url[0] != "/"){
		url = "/" + url;
	}
	return url;
}