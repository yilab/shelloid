/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var utils = lib_require("utils");

exports.addAll = function(appCtx){
	var routes = appCtx.routes;
	var i;
	for(i=0;i < routes.length; i++){
		var ok = module.exports.add(appCtx.app, routes[i]);
		if(!ok){
			appCtx.hasErrors = true;
		}
	}
	return i;
}

exports.add = function(app, ctrl){
	var urlPath = ctrl.url;
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
	
	if(utils.isArray(method)){
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
	
	return true;
}
