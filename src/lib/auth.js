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

/*
Default implementations: stores the user object directly in the session store 
(by passing the stringified object as the 'id').
*/
passport.serializeUser(function(user, done) {
	var id = JSON.stringify(user);
	done(null, id);
});

passport.deserializeUser(function(id, done) {
	var user = JSON.parse(id);
    done(false, user);
});

exports.addAll = function(appCtx, done){
	var authMods = appCtx.authMods;	

	var barrier = utils.countingBarrier(authMods.length, done);
	
	for(var i=0;i < authMods.length; i++){
		addAuthMod(appCtx, authMods[i], barrier);
	}
	
}

var passportModules = {
	"local" : {name: "passport-local", version: "*", configure : configureLocalAuth},
	"google" : {name: "passport-google", version: "*", configure : configureProviderAuth},
	"facebook" : {name: "passport-facebook", version: "*", configure : configureProviderAuth},
	"twitter" : {name: "passport-twitter", version: "*", configure : configureProviderAuth}
}

function addAuthMod(appCtx, authMod, barrier){
	if(!authMod.annotations.auth){	
		console.log("@auth annotation not specified for authentication module: " + 
				authMod.relPath + " (" + authMod.fnName + ")");
		appCtx.hasErrors = true;
		barrier.countDown();
		return;
	}
	
	var authType = authMod.annotations.auth;
	
	if(!utils.isString(authType)){
		console.log("@auth annotation must be a string: " + authMod.relPath);		
		appCtx.hasErrors = true;
		barrier.countDown();
		return;
	}
	
	var modInfo = passportModules[authType];//might not exist!
		
	if(!modInfo){
		console.log("Custom authentication module: " + authMod.relPath 	+ 
					" with @auth entry: " +authType);
		sh.serverCtx.appCtx.customAuths[authType] = authMod;
		barrier.countDown();		
	}else{
		app_pkg.require(modInfo.name, modInfo.version, 
			function(mod){
				authMod.passportMod = mod;
				modInfo.configure(appCtx, authMod, authType);
				barrier.countDown();
			}
		);		
	}		
}

function configureLocalAuth(appCtx, authMod){
	var authPath = authMod.annotations.path;
	var authMethod = authMod.annotations.method;
	if(!authPath){
		console.log("Local authentication needs @path specification: " + 
					authMod.relPath + "( " + authMod.fnName + ")");
		appCtx.hasErrors = true;
		return;
	}
	
	if(!authMethod){
		authMethod = "post";
	}	
	
	var LocalStrategy = authMod.passportMod.Strategy;
	passport.use(new LocalStrategy(
		function(username, password, done){
			var authMsg = {username: username, password: password, type: "local"};
			invokeAuthModFn(authMsg, authMod, done);
		}
	));

	var routeFn = authRoute("local", appCtx, authMod);
	
	var route = {
		annotations: {
			path : authPath,
			method: authMethod
		},
		fn: routeFn,
		fnName: "localauth()",
		relPath: "_internal",
		type: "auth"
	};
	appCtx.routes.push(route);
}

function configureProviderAuth(appCtx, authMod, provider){
	var pathPrefix = authMod.annotations.pathPrefix;
	var authMethod = authMod.annotations.method;
	if(!pathPrefix){
		pathPrefix = appCtx.config.auth.prefix;
	}
	var authPath = pathPrefix + "/" + provider;
	var returnPath = authPath + "/return";
	var returnURL = appCtx.config.baseUrl +  returnPath;
	
	if(!authMethod){
		authMethod = "post";
	}	
	
	var AuthStrategy = authMod.passportMod.Strategy;
	var strategyConfig;
	var strategyFn;
	switch(provider){
		case "google":
			strategyConfig = 
			{
				returnURL: returnURL,
				realm: appCtx.config.baseUrl
			};
			strategyFn = function(req, identifier, profile, done) {
				var authMsg = {identifier: identifier, profile: profile, type: provider};
				invokeAuthModFn(authMsg, authMod, done);				
			}

			break;
		case "facebook" :
			strategyConfig = 
			{
				callbackURL: returnURL,
				clientID: appCtx.config.auth.facebook.appID,
				clientSecret: appCtx.config.auth.facebook.appSecret,
			};
			strategyFn = function(req, accessToken, refreshToken, profile, done){
				var authMsg = {profile: profile, type: provider};
				invokeAuthModFn(authMsg, authMod, done);							
			}
			break;
		case "twitter":
			strategyConfig = 
			{
				consumerKey: appCtx.config.auth.twitter.consumerKey,
				consumerSecret: appCtx.config.auth.twitter.consumerSecret,
				callbackURL: returnURL				
			};
			strategyFn = function(req, token, tokenSecret, profile, done) {
				var authMsg = {profile: profile, type: provider};
				invokeAuthModFn(authMsg, authMod, done);										
			}
			break;
		default:
			console.log("Does not support the provider: " + provider + 
						". Module: " + authMod.relPath + " (" + authMod.fnName + ")");
			appCtx.hasErrors = true;
			return;			
	}
	
	strategyConfig.stateless = true;//to remove the need for session affinity when scaling out.
	strategyConfig.passReqToCallback = true;
	
	passport.use(new AuthStrategy(strategyConfig, strategyFn));

	appCtx.app.get(authPath, passport.authenticate(provider));
	
	var routeFn = authRoute(provider, appCtx, authMod);	
	
	var route = {
		annotations: {
			path : authPath,
			method: authMethod
		},
		fn: passport.authenticate(provider),
		fnName: 'passport.authenticate("' + provider + '")',
		relPath: "_internal",
		type: "auth"
	};
	
	var returnRoute = {
		annotations: {
			path : returnPath,
			method: "get"
		},
		fn: routeFn,
		fnName: '_internal',
		relPath: "_internal",
		type: "auth"
	};
		
	appCtx.routes.push(route);
	appCtx.routes.push(returnRoute);
}

function invokeAuthModFn(authMsg, authMod, done){
	var successFn = function(user){
		done(null, user);
	};
	var errorFn = function(err){
		console.log("Authentication error: " + err);
		done(null, false, {message: err});
	}
	errorFn.sys = function(err){
		console.log("System error: " + err);			
		done(err);
	}
	errorFn.app = errorFn;
	authMod.fn(authMsg, successFn, errorFn, sh.routeCtx);
}

function authRoute(authType, appCtx, authMod){
	var successRedirect = authMod.annotations.success || appCtx.config.auth.successRedirect;
	var failureRedirect = authMod.annotations.failure || appCtx.config.auth.failureRedirect;

	var route = 
		function(req, res, next) {
		  passport.authenticate(authType, function(err, user, info) {
				if (err) { return next(err); }
				if (!user) { 
					return res.redirect(failureRedirect); 
				}
				req.logIn(user, function(err) {
					if (err) { 
						return next(err); 
					}
					return res.redirect(successRedirect);
				});
			})(req, res, next);
		};
	return route;
}