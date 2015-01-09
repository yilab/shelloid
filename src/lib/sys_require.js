/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var sysCtx;
var utils = lib_require("utils");
 
module.exports = function(param){
	if(utils.isObject(param)){
		sysCtx = param;
		return;
	}
	var p = sysCtx.basePath + "/node_modules/" + param;
	var m = require(p);
	return m;
}