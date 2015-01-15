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
  
 module.exports = function(name){
	return new Concur(name);
 }
 
 function Concur(name){
 	ctrlBase.CtrlBase.call(this, name);
 }
 
Concur.prototype = Object.create(ctrlBase.CtrlBase.prototype);
 
 Concur.prototype.executeImpl = function(){
	var concur = this;
	var barrier = utils.countingBarrier(this.stepBuf.length,
		function(){
			if(concur.repeat){
				concur.repeat = false;
				process.nextTick(function(){
					concur.executeImpl();
				});
			}
			for(var i=0;i<concur.doneHandlers.length;i++){
				concur.doneHandlers[i].call(null);
			}
			concur.executing = false;
		}
	);

	for(var i=0;i<this.stepBuf.length;i++){
		executeStep(stepBuf[i]);
	}	
 }
 
function executeStep(s){
	var concur = this;
	assert(s);
	if(utils.isFunction(s.stepFn)){
		var req = {};
		var res = {};
		req.res = res;
		res.req = req;
		req.skip = function(){
			req.route = res.render = res.send = res.json = nop;
			barrier.countDown();
		}
		req.repeat = function(){
			s.repeat = true;
		}
		req.route = function(){
			sh.sim.route(req, res);
		}
		res.json = res.send = function(obj){
			if(s.successFn){
				s.successFn();
			}
			if(s.repeat){
				s.repeat = false;
				process.nextTick(function(){
					concur.executeStep(s);
				});
			}
			barrier.countDown();
			console.log("Got response for: " + req.url);
		}
		res.render = function(p1, p2, p3){
			if(s.successFn){
				s.successFn();
			}				
			if(s.repeat){
				s.repeat = false;
				process.nextTick(function(){
					concur.executeStep(s);
				});
			}			
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
}

 
 function nop(){
 }