/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

exports.loadExtensions(appCtx, done){ 
	loadBuiltins(appCtx, loadUserSupplied.bind(null, appCtx, done));
}

function loadBuiltins(appCtx, done){
	var paths = utils.recurseDirSync(appCtx.config.dirs.ext);
	for(var i=0;i<paths.length;i++){
		var pathInfo = paths[i];
		var ext = require(pathInfo.path);
	}
}

function loadUserSupplied(appCtx, done){
}