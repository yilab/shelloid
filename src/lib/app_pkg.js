var utils = require("utils");
var assert = require("assert");
var npm = require("npm");
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
	if(utils.dirExits(pkgPath)){
		var m = require(pkgPath);
		done(m);
	}else{
		if(pkgVersion != "*"){
			pkgName = pkgName + "@" + pkgVersion;
		}
		console.log("Installing application package: " + pkgName);
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