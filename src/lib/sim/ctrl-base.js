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

function CtrlBase(){
	this.fnReq = [];
}
 
 CtrlBase.prototype.step = function(p1, p2){
	var fn = utils.isFunction(p1) ? p1 : p2;
	var name = utils.isString(p1) ? p1 : "unnamed";
	var s = {src: sh.caller(""), stepFn: fn, name: name: successFn: null, failFn: null};

	this.fnReq.push(s);
 }
 
 CtrlBase.prototype.success = function(fn){
	if(this.fnReq.length > 0){
		var s = this.fnReq[this.fnReq.length - 1];
		if(s.successFn){
			throw new Error(sh.caller("sim: success() already defined for the step()."));	
		}
		s.successFn = fn;
	}else
	{
		throw new Error(sh.caller("sim: success() can only be called after a step()."));
	}
 }
 
 CtrlBase.prototype.fail = function(fn){
	if(this.fnReq.length > 0){
		var s = this.fnReq[this.fnReq.length - 1];
		if(s.failFn){
			throw new Error(sh.caller("sim: fail() already defined for the step()."));	
		}
		s.failFn = fn;
	}else
	{
		throw new Error(sh.caller("sim: fail() can only be called after a step()."));
	}
 }
 
 exports.CtrlBase = CtrlBase;