/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var assert = require("assert");
var npm = require("npm");
var fs = require("fs");

var utils = lib_require("utils");

var appCtx;

exports.init = function(ctx, done){
	appCtx = ctx;
	npm.load({
		loaded: false
	}, function (err) {	
		if(err){
			console.log("Error loading npm module: " + err);
			appCtx.hasErrors = true;
		}else{
			npm.on("log", function (message) {
					// log the progress of the installation
					console.log(message);
				}
			);		
		}
		done(err);
	});
	
}

exports.require = function(pkgName, pkgVersion, done){
	assert(appCtx && appCtx.basePath);
	var pkgPath = appCtx.basePath + "/node_modules/" + pkgName;
	if(utils.dirExists(pkgPath)){
		var m = require(pkgPath);
		done(m);
	}else{
		if(pkgVersion != "*"){
			pkgName = pkgName + "@" + pkgVersion;
		}
		console.log("Installing application package: " + pkgName);
		appCtx.packageJson.dependencies[pkgName] = pkgVersion;
		
		utils.writeJsonSync(appCtx.packageJsonPath, appCtx.packageJson);
		appCtx.packageJsonModified = true;
		
		npm.commands.install(appCtx.basePath, [pkgName], 
			function (err, data) {
				if(err){
					console.log("Error installing application package: " + pkgName + " : " + err);
					appCtx.hasErrors = true;
					done(false);
				}else{
					console.log("Application package: " + pkgName + " successfully installed");
					var m = require(pkgPath);
					done(m);	
				}				
			}
		);		
	}
}