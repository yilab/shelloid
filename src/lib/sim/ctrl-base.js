/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var utils = lib_require("utils");

function CtrlBase(name){
	this.name = name;
	this.stepBuf = [];
	this.stepsExecuted = [];
	this.stepsRemaining = [];
	this.doneHandlers = [];
}
 
 CtrlBase.prototype.step = function(nameOrFn, maybeFn){
	var name, fn; 
	if(utils.isString(nameOrFn)){
		name = nameOrFn;
		fn = maybeFn;
	}else{
		name = "unnamed";
		fn = nameOrFn;
	}
	var s = {src: sh.caller(""), stepFn: fn, name: name, successFn: null, failFn: null};

	this.stepBuf.push(s);
	return this;
 }
 
 CtrlBase.prototype.success = function(fn){
	if(this.stepBuf.length > 0){
		var s = this.stepBuf[this.stepBuf.length - 1];
		if(s.successFn){
			throw new Error(sh.caller("sim: success() already defined for the step()."));	
		}
		s.successFn = fn;
	}else
	{
		throw new Error(sh.caller("sim: success() can only be called after a step()."));
	}
	return this;
 }
 
 CtrlBase.prototype.fail = function(fn){
	if(this.stepBuf.length > 0){
		var s = this.stepBuf[this.stepBuf.length - 1];
		if(s.failFn){
			throw new Error(sh.caller("sim: fail() already defined for the step()."));	
		}
		s.failFn = fn;
	}else
	{
		throw new Error(sh.caller("sim: fail() can only be called after a step()."));
	}
	return this;
 }
 
 CtrlBase.prototype.done = function(fn){
	this.doneHandlers.push(fn);
	return this;
 }
 
 CtrlBase.prototype.execute = function(){
	var ctrl = this;
	if(this.isExecuting){
		throw new Error("Attempt to execute an already executing control block.Name: " + this.name);
	}

	this.stepsRemaining = this.stepBuf.slice();
	this.doRepeat = false;
	if(this.stepsRemaining.length > 0){
		this.isExecuting = true;	
		process.nextTick(function(){
			ctrl.executeImpl();
		});
	}else{
		sh.info(sh.caller("Execute() on empty sequence"));
	}
 }
 
 CtrlBase.prototype.executeImpl = function(){
 	sh.info(sh.caller("Empty ExecuteImpl() of CtrlBase called."));
 }
 
 CtrlBase.prototype.cancel = function(){
	throw new Error(sh.caller("Cancel() not implemented"));
 }
 
 CtrlBase.prototype.repeat = function(){
	this.doRepeat = true;
 }
  
 exports.CtrlBase = CtrlBase;