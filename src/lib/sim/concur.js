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
var ctrlBase = lib_require("sim/ctrl-base");
var utils = lib_require("utils");
  
 module.exports = function(){
	return new Concur();
 }
 
 function Concur(){
 	ctrlBase.CtrlBase.call(this);
 }
 
Concur.prototype = Object.create(ctrlBase.CtrlBase.prototype);
 
 Concur.prototype.executeImpl = function(){
	var concur = this;
	var barrier = utils.countingBarrier(this.stepBuf.length,
		function(){
			for(var i=0;i<concur.doneHandlers.length;i++){
				concur.doneHandlers[i].call(null);
			}
		}
	);

	for(var i=0;i<this.stepBuf.length;i++){
		(function(s){
			assert(s);
			if(utils.isFunction(s.stepFn)){
				var req = {};
				var res = {};
				req.res = res;
				res.req = req;
				req.route = function(){
					sh.sim.route(req, res);
				}
				res.json = res.send = function(obj){
					barrier.countDown();
					console.log("Got response for: " + req.url);
				}
				res.render = function(p1, p2, p3){
					barrier.countDown();
				}
				process.nextTick(function(){
					s.stepFn(req, res);
				});
			}else{
				var ctrl = s.stepFn;
				ctrl.done(function(){
					barrier.countDown();
				});
				process.nextTick(function(){
					ctrl.execute();	
				});
			}
		})(this.stepBuf[i]);
	}	
 }
 