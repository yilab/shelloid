var passport = require("passport");
var app_mod = lib_require("app_mod");
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
		console.log("@auth annotation not specified for authentication module: " + authMod.relPath);
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
				app_mod.require(modInfo.name, modInfo.version, 
					function(mod){
						var LocalStrategy = new mod.Strategy;
						passport.use(new LocalStrategy(
							function(username, password, done){
								var authMsg = {username: username, password: password, type: "local"};
								authMod.fn(authMsg, done);
							}
						));
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
