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
var events = require('events');
var utils = lib_require("utils");
var annotation = lib_require("annotation");

exports.loadControllers = function(serverCtx, done)
{
	appPath = serverCtx.appCtx.basePath + "/" + serverCtx.constants.controllerDir;
	appPath = path.normalize(appPath);
	if(!utils.dirExists(appPath)){
		console.log("Controllers folder 'routes' does not exist");
		process.nextTick(done);
		return;		
	}	
	var appPathLength = appPath.length;
	var files = utils.recurseDirSync(appPath);
	var sync = new events.EventEmitter();
	var filesToBeProcessed = files.length;
	sync.on("file-processed", function(){
		filesToBeProcessed--;
		if(filesToBeProcessed <= 0){
			done();
		}
	});
	for(var i=0;i<files.length;i++){
		if(files[i].path.endsWith(".js")){
			console.log("Processing: " + files[i].path);
			annotation.parseAnnotations(files[i], serverCtx, 
				function(pathInfo, annotations){
					var url = pathToURL(pathInfo.path, appPathLength);			
					var m = require(pathInfo.path);
					for(f in m){
						if(m.hasOwnProperty(f) && (typeof m[f]) == 'function'){
							if(f != "index"){
								url = url + "/" + f;
							}
							if(serverCtx.appCtx.controllers[url] === undefined){
								serverCtx.appCtx.controllers[url] = {
									fn: m[f],
									fnName: f,
									annotations: annotations[f],
									path: pathInfo.path,
									relPath : pathInfo.relPath
								};
							}else{
								console.log("A controller with the same URL already exists. URL: " + 
									url + ". Path: " + pathInfo.path);
							}
						}
					}
					sync.emit("file-processed");
				}
			);
		}else
		{
			filesToBeProcessed--;
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