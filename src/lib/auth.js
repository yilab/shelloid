/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var passport = require("passport");
var app_pkg = lib_require("app_pkg");
var utils = lib_require("utils");

exports.addAll = function(appCtx, done){
	var authMods = appCtx.authMods;	

	var barrier = utils.countingBarrier(authMods.length, done);
	
	for(var i=0;i < authMods.length; i++){
		addAuthMod(appCtx, authMods[i], barrier);
	}
	
}

var passportModules = {
	"local" : {name: "passport-local", version: "*"}
}

function addAuthMod(appCtx, authMod, barrier){
	if(!authMod.annotations.auth){	
		console.log("@auth annotation not specified for authentication module: " + 
				authMod.relPath + " (" + authMod.fnName + ")");
		appCtx.hasErrors = true;
		barrier.countDown();
		return;
	}
	
	var authTypes = authMod.annotations.auth;
	if(!utils.isArray(authTypes)){
		authTypes = [authTypes];
	}
	
	var innerBarrier = utils.countingBarrier(authTypes.length, 
		function()
		{
			barrier.countDown();
		}
	);
	
	for(var i=0;i<authTypes.length;i++){
		var authType = authTypes[i];
		if(!utils.isString(authType)){
			console.log("@auth annotation must be a string or an array of strings: " 
				+ authMod.relPath);		
			appCtx.hasErrors = true;
			innerBarrier.countDown();
		}
		
		var modInfo = passportModules[authType];//might not exist!
		
		switch(authType){
			case "local" : 
				app_pkg.require(modInfo.name, modInfo.version, 
					function(mod){
						var LocalStrategy = mod.Strategy;
						passport.use(new LocalStrategy(
							function(username, password, done){
								var authMsg = {username: username, password: password, type: "local"};
								var successFn = function(user){
									done(null, user);
								}
								var errorFn = function(err){
									done(null, false, {message: err});
								}
								errorFn.sys = function(err){
									done(err);
								}
								errorFn.app = errorFn;
								authMod.fn(authMsg, successFn, errorFn);
							}
						));
						innerBarrier.countDown();
					}
				);
				break;
			default:
				console.log("Don't know how to process the authentication module: " + authMod.relPath 
					+ " with @auth entry: " + authType);
				appCtx.hasErrors = true;
				innerBarrier.countDown();
				break;
		}
	}
	return true;
}
