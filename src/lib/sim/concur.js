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
	var barrier = utils.countingBarrier(this.stepsRemaining.length,
		function(){
			if(concur.doRepeat){
				concur.doRepeat = false;
				process.nextTick(function(){
					concur.executeImpl();
				});
			}
			for(var i=0;i<concur.doneHandlers.length;i++){
				concur.doneHandlers[i].call(null);
			}
			concur.isExecuting = false;
		}
	);

	for(var i=0;i<this.stepsRemaining.length;i++){
		this.executeStep(this.stepsRemaining[i], barrier);
	}	
 }
 
Concur.prototype.executeStep = function(s, barrier){
	var concur = this;
	assert(s);
	if(utils.isFunction(s.stepFn)){
		var req = {};
		var res = {};
		req.res = res;
		res.req = req;
		req.skip = function(){
			req.route = res.render = res.send = res.json = nop;
			req.doSkip = true;
			barrier.countDown();
		}
		req.repeat = function(){
			req.doRepeat = true;
		}
		req.route = function(){
			sh.sim.route(req, res);
		}
		res.end = res.json = res.send = function(obj){
			if(s.successFn){
				s.successFn(req, res);
			}
			if(req.doRepeat){
				process.nextTick(function(){
					concur.executeStep(s, barrier);
				});
			}
			barrier.countDown();
			console.log("Got response for: " + req.url);
			return res;
		}
		res.render = function(p1, p2, p3){
			if(s.successFn){
				s.successFn(req, res);
			}				
			if(req.doRepeat){
				process.nextTick(function(){
					concur.executeStep(s, barrier);
				});
			}			
			barrier.countDown();
			return res;
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