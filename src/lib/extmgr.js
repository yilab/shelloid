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
var utils = lib_require("utils");
 
exports.loadExtensions(done){
	var internalBuiltInsDir = path.join(sh.serverCtx.basePath, "src/ext");
	loadBuiltins(
		internalBuiltInsDir, 
		loadExternal.bind(
			null, 
			loadBuiltIns.bind(null, sh.appCtx.config.dirs.ext, done)
		)
	);
}

function loadBuiltins(builtinsDir, done){
	var paths = utils.recurseDirSync(builtInsDir);
	for(var i=0;i<paths.length;i++){
		var pathInfo = paths[i];
		var ext = require(pathInfo.path);
	}
}

function loadExternal(done){
}