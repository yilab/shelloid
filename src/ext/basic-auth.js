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
	annotations:[
		{name: "noauth", process: processNoAuth},
		{name: "auth", process: processAuth}
	],
	hooks:[
	{type: "preroute", handler: sessionAuth, priority: sh.hookPriorities.auth, invokeIf: ["!auth"]}
	]
};

function processNoAuth(annotations, keyFields, value){
	annotations.addHook({type: "preroute", handler: noAuth, priority: sh.hookPriorities.auth, invokeIf: null} 
	);
}

function processAuth(annotations, keyFields, value){
	if(!value){
		return true;
	}
	annotations.addHook(
	{type: "preroute", handler: customAuth, priority: sh.hookPriorities.auth, invokeIf: ["!auth"]} );
}

function noAuth(req, res, done){
	req.setFlag("auth");
	done();
}


function sessionAuth(req, res, done){
	if(req.user){
		req.setFlag("auth");
	}else{
		req.sh.errors.push("Access attempt without login session for: " + req.url);
	}
	done();
}

function customAuth(req, res, done){	
	var auth = req.route.annotations.auth;	
	
	var success = function(){
		req.setFlag("auth");
		done();
	}
	
	var err = function(msg){
		req.sh.errors.push("Custom authentication: " + auth + " failure for: " + req.url);
		done();
	}
	
	if(auth){
		var authMod = sh.serverCtx.appCtx.customAuths[auth];
		if(authMod){
			authMod.fn(req, success, err);			
		}else{
			sh.error("Custom authentication module for: " + auth + " not found");
		}
	}
	
}
