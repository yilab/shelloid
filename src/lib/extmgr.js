/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var path = require("path");
var fs = require("fs");
var utils = lib_require("utils");
 
exports.loadExtensions = function(done){	
	sh.ext = {hooks:{}, annotationProcessors:{}, mods:[]};
	sh.hookPriorities = {
		preAuth: -50,
		auth: 0,
		authr: 50,
		postAuth: 100
	};
	
	var internalBuiltInsDir = path.join(sh.serverCtx.basePath, "src/ext");
	loadBuiltins(
		internalBuiltInsDir, 
		"internal",
		loadExternal.bind(
			null, 
			loadBuiltins.bind(null, sh.appCtx.config.dirs.ext, "app", done)
		)
	);
}

function loadBuiltins(extDir, kind, done){
	if(!utils.dirExists(extDir)){
		done();
		return;
	}
	
	var files = fs.readdirSync(extDir);
	for(var i=0;i<files.length;i++){
		var p = path.resolve(extDir, files[i]);
		if(utils.dirExists(p)){
			p = path.resolve(p, "index.js");
		}
		if(utils.fileExists(p)){
			var ext = require(p);
			var extInfo = ext();
			extInfo.path = p;
			extInfo.name = files[i];
			extInfo.kind = kind;
			addExtension(extInfo);
		}
	}
	done();
}

function loadExternal(done){
	var exts = sh.appCtx.config.extensions;
	var barrier = utils.countingBarrier(exts.length, done);
	for(var i=0;i<exts.length;i++){
		(function(ext){
			app_pkg.require(ext.name, ext.version,
				function(mod){
					extInfo = mod();
					extInfo.kind  = "external";
					extInfo.name = ext.name;
					extInfo.version = ext.version;
					addExtension(extInfo);
					barrier.countDown();
				}
			);
		})(exts[i]);
	}	
}

function addExtension(extInfo){
	sh.ext.mods.push(extInfo);
	if(extInfo.annotations){
		for(var i=0;i<extInfo.annotations.length;i++){
			var annotationDef = extInfo.annotations[i];
			sh.ext.annotationProcessors[annotationDef.name] = annotationDef;
		}
	}
	
	if(extInfo.hooks){
		for(var i=0;i<extInfo.hooks.length;i++){
			var hook = extInfo.hooks[i];
			if(!hook.priority && hook.priority != 0){
				hook.priority = Infinity;
			}
			if(!sh.ext.hooks[hook.type]){
				sh.ext.hooks[hook.type] = [];
			}
			utils.priorityInsert(sh.ext.hooks[hook.type], hook);
		}
	}
}