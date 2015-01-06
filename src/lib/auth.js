var passport = require("passport");

var utils = lib_require("utils");

exports.addAll = function(appCtx){
	var authMods = appCtx.authMods;
	
	var i;
	for(i=0;i < authMods.length; i++){
		var ok = addAuthMod(authMods[i]);
		if(!ok){
			appCtx.hasErrors = true;
		}
	}
	return i;
}

function addAuthMod(authMod){
	if(!authMod.annotations.auth){	
		console.log("@auth annotation not specified for authentication module: " + authMod.relPath);
		return false;
	}
	
	var authTypes = authMod.annotations.auth;
	if(!utils.isArray(authTypes)){
		authTypes = [authTypes];
	}
	
	for(var i=0;i<authTypes.length;i++){
		var authType = authTypes[i];
		if(!utils.isString(authType)){
			console.log("@auth annotation must be a string or an array of strings: " 
				+ authMod.relPath);		
			return false;
		}
		
		switch(authType){
			case "local" : 
				console.log("local");
				break;
			default:
				console.log("Don't know how to process the authentication module: " + authMod.relPath 
					+ " with @auth entry: " + authType);
				return false;
		}
	}
	return true;
}