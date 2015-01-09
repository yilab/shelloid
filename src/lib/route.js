/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var domain = require('domain');

var utils = lib_require("utils"),
	validate = 	lib_require("validate");

exports.addAll = function(appCtx){
	var routes = appCtx.routes;
	var i;
	for(i=0;i < routes.length; i++){
		var ok = module.exports.add(appCtx, routes[i]);
		if(!ok){
			appCtx.hasErrors = true;
		}
	}
	return i;
}

exports.add = function(appCtx, route){
	var app = appCtx.app;
	var urlPath = route.url;
	if(route.annotations["path"]){
		urlPath = route.annotations["path"];
	}else if(route.annotations["pathSuffix"]){
		var pathSuffix = route.annotations["pathSuffix"];
		if(pathSuffix.startsWith("/")){
			urlPath = urlPath + pathSuffix;
		}else{
			urlPath = urlPath + "/" + pathSuffix;
		}
	}
	var method = ["all"];
	if(route.annotations["method"]){
		method = route.annotations["method"];
	}
	
	if(!utils.isArray(method)){
		method = [method];
	}
	
	for(var i=0;i<method.length;i++){

		var fn = routeWrapper(route, appCtx);
			
		console.log("Mounting " + route.relPath + 
					" (" + route.fnName + ") at " + urlPath + " (" + method[i] + "). ");
						
		app[method[i]](urlPath, fn);
	}
	
	return true;
}

function routeWrapper(route, appCtx){
	var doAuth = true;
	var isAuthRoute = (route.type == "auth");
	
	if(isAuthRoute || route.annotations.noauth){
		doAuth = false;
		if(route.type != "auth"){
			console.log("Authentication disabled with @noauth for " + route.relPath + " (" + 
						route.fnName + ")");
		}
	}
	
	var ifc = appCtx.interfaces[route.relPath + "/req"];
	
	return function(req, res){
		req.validated = function(){
			authMod.fn(req.res);
		}
		req.assert = function(cond){
			if(!cond){
				throw(new ValidateError("Assertion failed in function " __caller_function + 
									"("+__caller_file +":" + __caller_line+")");)
			}
		}
		
		if(doAuth && !req.user){
			res.status(401).send('Unauthorized');
			console.log("Unauthenticated access to: " + authMod.relPath + " (" + authMod.fnName + ")");
			return;
		}else{
			if(isAuthRoute || validate.requestOk(req, ifc, appCtx)){
				if(route.validate){
					var d = require('domain');
					d.add(req);
					d.add(res);
					d.on('error', function(er) {
						if(er.constructor == "ValidateError"){
							console.log(er);
						}else{
							console.log("System Error: " +er);
							//TODO probably initiate system shutdown?
						}
						res.status(400).send("Bad Request");
					});
					d.run(function(){
						route.validate(req);
					});
				}else{
					req.validated();
				}
			}else{
				res.status(400).send("Bad Request");
			}
		}
	}
}

function ValidateError(msg){
	this.msg = msg;
}