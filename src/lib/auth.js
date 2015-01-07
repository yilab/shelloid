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
	"google" : {name: "passport-google", version: "*", configure : configureGoogleAuth}
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
		
		if(!modInfo){
			console.log("Don't know how to process the authentication module: " + authMod.relPath 
				+ " with @auth entry: " + authType);
			appCtx.hasErrors = true;
			innerBarrier.countDown();		
		}else{
			app_pkg.require(modInfo.name, modInfo.version, 
				function(mod){
					authMod.passportMod = mod;
					modInfo.configure(appCtx, authMod);
					innerBarrier.countDown();
				}
			);		
		}		
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
			var successFn = function(user){
				done(null, user);
			};
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

	var routeFn = function(req, res, next) {
	  passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) { 
				return res.redirect(appCtx.config.auth.failureRedirect); 
			}
			req.logIn(user, function(err) {
				if (err) { 
					return next(err); 
				}
				return res.redirect(appCtx.config.auth.successRedirect);
			});
		})(req, res, next);
	};	
	
	var route = {
		annotations: {
			path : authPath,
			method: authMethod
		},
		fn: routeFn,
		fnName: "localauth()",
		relPath: "_internal"
	};
	appCtx.routes.push(route);
}

function configureGoogleAuth(appCtx, authMod){
	var pathPrefix = authMod.annotations.pathPrefix;
	var authMethod = authMod.annotations.method;
	if(!pathPrefix){
		pathPrefix = appCtx.config.auth.prefix;
	}
	var authPath = pathPrefix + "/google";
	var returnPath = authPath + "/return";
	var returnURL = appCtx.config.baseUrl +  returnPath;
	
	if(!authMethod){
		authMethod = "post";
	}	
	
	var GoogleStrategy = authMod.passportMod.Strategy;
	
	passport.use(new GoogleStrategy({
			returnURL: returnURL,
			realm: appCtx.config.baseUrl
		},
		function(identifier, profile, done) {
			var authMsg = {identifier: identifier, profile: profile, type: "provider"};
			var successFn = function(user){
				done(null, user);
			};
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

	appCtx.app.get('/auth/google', passport.authenticate('google'));
	
	var routeFn = function(req, res, next) {
	  passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) { 
				return res.redirect(appCtx.config.auth.failureRedirect); 
			}
			req.logIn(user, function(err) {
				if (err) { 
					return next(err); 
				}
				return res.redirect(appCtx.config.auth.successRedirect);
			});
		})(req, res, next);
	};	
	
	var route = {
		annotations: {
			path : authPath,
			method: authMethod
		},
		fn: passport.authenticate('google'),
		fnName: 'passport.authenticate("google")',
		relPath: "_internal"
	};
	
	var returnRoute = {
		annotations: {
			path : returnPath,
			method: "get"
		},
		fn: routeFn,
		fnName: '_internal',
		relPath: "_internal"
	};
		
	appCtx.routes.push(route);
	appCtx.routes.push(returnRoute);
}