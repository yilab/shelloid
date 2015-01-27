/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
 
module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	hooks:[
	{type: "preroute", handler: handleCors, priority: sh.hookPriorities.preAuth, 	invokeIf: null}
	]
};

function handleCors(req, res, done){
	var config = sh.serverCtx.appCtx.config;
	if(req.headers.origin && (config.allowDomains.length > 0)){
		checkCors0(req, res, config.allowDomains);
	}
	done();
}

function handleCors0(req, res, allowDomains){
	var route = req.route;
	if(route.annotations.allowDomains === false){
		sh.error("Cross origin request for " + req.url + " for which @allowDomains is false");
		req.setFlag("abort", 403, "Forbidden");
		return;
	}
	var origin = req.headers.origin.toLowerCase();
	var ok = false;
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
			ok = true;
			break;
		}
	}
	
	if(!ok){
		req.setFlag("abort", 403, "Forbidden");
	}
}

