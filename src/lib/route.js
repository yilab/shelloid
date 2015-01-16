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
		var ok = addRoute(appCtx, routes[i]);
		if(!ok){
			appCtx.hasErrors = true;
		}
	}
	return i;
}

exports.add = addRoute;

function addRoute(appCtx, route){
	var app = appCtx.app;
	var urlPath = route.url;
	
	if(route.annotations.ignore){
		return true;
	}
	
	if(!utils.isFunction(route.fn)){
		return false;
	}
	
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
	
	var modIfcReq, modIfcRes;
	var interfaceName = route.annotations["interface"];
	if(interfaceName){
		modIfcReq = appCtx.interfaces[interfaceName + "/req"];
		modIfcRes = appCtx.interfaces[interfaceName + "/res"];
	}
	
	var ifcReq = modIfcReq ? modIfcReq.fn : false;
	var ifcRes = modIfcRes ? modIfcRes.fn : false;
	
	return function(req, res){
		req.route = route;
		if(!preprocessRequest(req, res, route)){
			return;
		}
		req.validated = function(){
			res.json_ = res.json;
			res.render_ = res.render;
			res.validated = function(){			
				if(res.sh.pendingOp == "json"){
					res.json_.apply(res, res.sh.opParams);
				}else
				if(res.sh.pendingOp == "render"){
					res.render_.apply(res, res.sh.opParams);
				}else{
					throw new Error("Unknown operation in res.validate()");
				}
			}
			res.assert = function(cond){
				if(!cond){
					var msg = sh.caller("Assertion failed in function");
					throw(new ValidateError(msg));
				}
			};			
			res.json = function(obj){
				res.sh = {pendingOp: "json", opParams: [obj]};
				checkResponseObject(req, res, obj, ifcRes, appCtx);
			};			

			res.render = function(p1, p2, p3){
				res.sh = {pendingOp: "render", opParams: [p1, p2, p3]};			
				if(!utils.isObject(p2)){
					res.render_(p1, p2, p3);
				}else{
					checkResponseObject(req, res, p2, ifcRes, appCtx);
				}
			}
			
			var d0 = require('domain').create();
			d0.add(req);
			d0.add(res);
			d0.on('error', function(err) {
				if(err.constructor.name == "ValidateError"){
					sh.error("Response validate error: " + er.msg + " for " + req.url);
				}else{			
					sh.error(sh.caller("Error executing the response stack for: " + req.url + ". Error: " + err.stack));
					res.status(500).end("Internal Server Error.");	
				}
			});
			d0.run(function(){
				route.fn(req, res, sh.routeCtx);
			});
		};
		
		req.assert = function(cond){
			if(!cond){
				var msg = sh.caller("Assertion failed in function");
				throw(new ValidateError(msg));
			}
		};
				
		var postAuth = function(authOk){
			if(!authOk){
				res.status(401).send('Unauthorized');
				console.log("Unauthenticated access to: " + route.relPath + " (" + route.fnName + ")");
				return;
			}else{
				if(isAuthRoute || validate.requestOk(req, ifcReq, appCtx)){
					if(ifcReq.validate){
						var d = require('domain').create();
						d.add(req);
						d.add(res);
						d.on('error', function(er) {
							if(er.constructor.name == "ValidateError"){
								sh.error("Validate Error: " + er.msg);
							}else{
								sh.error("System Error: " + er.msg);
							}
							res.status(400).end("Bad Request");
						});
						d.run(function(){
							ifcReq.validate(req, sh.routeCtx);
						});
					}else{
						req.validated();
					}
				}else{
					sh.info(sh.loc("Bad request at: " + req.url));
					res.status(400).end("Bad Request");
				}
			}
		}
		
		if(doAuth){
			checkAuth(req, res, postAuth);
		}else{
			postAuth(true);
		}
		
	}
}

function ValidateError(msg){
	this.msg = msg;
}

function checkResponseObject(req, res, obj, ifcRes, appCtx){
	var contentType = validate.getContentType(ifcRes);
	if(contentType){
		res.setHeader("Content-Type", contentType);
	}
	if(!validate.responseOk(req, res, obj, ifcRes, appCtx)){
		res.status(500).end("Server Error: Bad Response!");	
	}
	if(ifcRes.validate){
		ifcRes.validate(req, res, sh.routeCtx);
	}else{
		res.validated();
	}
}

function preprocessRequest(req, res, route){
	var config = sh.serverCtx.appCtx.config;
	if(req.headers.origin && (config.allowDomains.length > 0)){
		doCors(req, res, route, config.allowDomains);
	}
	return true;
}

function doCors(req, res, route, allowDomains){
	if(route.annotations.allowDomains === false){
		sh.error("Cross origin request for " + req.url + " for which @allowDomains is false");
		return;
	}
	var origin = req.headers.origin.toLowerCase();
	for(var i=0;i<allowDomains.length;i++){
		var allow = allowDomains[i];
		var domain = allow.domain;
		if(domain == "*" || (domain == origin) || (allow.isRegExp && allow.domain.test(origin))){
			res.setHeader("Access-Control-Allow-Origin", origin);
			if(allow.cookie){
				res.setHeader("Access-Control-Allow-Credentials", "true");			
			}
			var methods = req.headers["Access-Control-Request-Method"];
			if(methods){
				methods = "GET, POST, OPTIONS, " + methods;
				res.setHeader("Access-Control-Allow-Methods", methods);
			}
			var headers = req.headers["Access-Control-Request-Headers"];
			if(headers){
				res.setHeader("Access-Control-Allow-Headers", headers);
			}			
			res.setHeader("Access-Control-Max-Age", "1728000");
			break;
		}
	}
}

function checkAuth(req, res, callback){	
	var auth = req.route.annotations.auth;	
	var calledBack = false;
	var success = function(obj){
		if(calledBack) return;
		calledBack = true;
		req.user = obj;
		callback(true);
	}
	var err = function(msg){
		if(calledBack) return;
		calledBack = true;	
		sh.error("Authentication failure for: " + req.url + ". Error: " + msg);
		callback(false);
	}
	if(auth){
		var authMod = sh.serverCtx.appCtx.customAuths[auth];
		if(authMod){
			authMod.fn(req, success, err);			
		}else{
			sh.error("Custom authentication module for: " + auth + " not found. Falling back on session auth");
		}
	}else{
		callback(req.user ? true : false);
	}
}