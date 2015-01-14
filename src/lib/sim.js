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
 
 exports.init = function(){
	sh.sim = {};
	sh.sim.route = route;
	sh.sim.seq = lib_require("sim/seq");
	sh.sim.concur = lib_require("sim/concur");
 }
 
 exports.enterSimMode = function(){
	sh.serverCtx.simMode = true;
	var simJs = path.join(sh.serverCtx.appCtx.config.dirs.sim, "/main.js");
	if(utils.fileExists(simJs)){
		var simMain = require(simJs);
		if(!utils.isFunction(simMain)){
			sh.error("Simulator script: " + simJs + " must have a function assigned to module.exports");
			process.exit(0);
		}
		sh.info("Starting simulator run.");
		simMain(function(){
			sh.info("Simulator run over.");
		});
	}
 }
 
 function route(req, res){
	//TODO
	res.send({info : "hello"});
 }
