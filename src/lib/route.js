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
	
	var modIfcReq = appCtx.interfaces[route.relPath + "/req"];
	var modIfcRes = appCtx.interfaces[route.relPath + "/res"];
	
	var ifcReq = modIfcReq ? modIfcReq.fn : false;
	var ifcRes = modIfcRes ? modIfcRes.fn : false;
	
	return function(req, res){
		req.validated = function(){
			res.json_ = res.json;
			res.render_ = res.render;
			res.json = function(obj){
				if(checkResponseObject(req, res, obj, ifcRes, appCtx)){
					res.json_(obj);
				}
			};			

			res.render = function(p1, p2, p3){
				if(!utils.isObject(p2) || checkResponseObject(req, res, p2, ifcRes, appCtx)){
					res.render_(p1, p2, p3); 
				}
			}
			
			var d0 = require('domain').create();
			d0.add(req);
			d0.add(res);
			d0.on('error', function(err) {
				sh.error(sh.caller("Error executing the controller: " + req.url + ". Error: " + err.stack));
				res.status(500).end("Internal Server Error.");	
			});
			d0.run(function(){
				route.fn(req, res);
			});
		};
		
		req.assert = function(cond){
			if(!cond){
				var msg = sh.caller("Assertion failed in function");
				throw(new ValidateError(msg));
			}
		};
		
		if(doAuth && !req.user){
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
						ifcReq.validate(req);
					});
				}else{
					req.validated();
				}
			}else{
				sh.info("Bad request at: " + req.url);
				res.status(400).end("Bad Request");
			}
		}
	}
}

function ValidateError(msg){
	this.msg = msg;
}

function checkResponseObject(req, res, obj, ifcRes, appCtx){
	var contentType = validate.getContentType(ifcRes);
	if(contentType){
		res.set("Content-Type", contentType);
	}
	if(!validate.responseOk(req, res, obj, ifcRes, appCtx)){
		res.status(500).end("Server Error: Bad Response!");	
		return false;
	}
	return true;
}
