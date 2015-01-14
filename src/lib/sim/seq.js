/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

 var ctrlBase = lib_require("sim/ctrl-base");
 
 module.exports = function(){
	return new Seq();
 }
 
 function Seq(){
	this.prev = {};
 }
 
 Seq.prototype = Object.create(ctrlBase.CtrlBase.prototype);
 
 Seq.prototype.execute = function(){
	if(this.fnReq.length > 0){
		execute(this);
	}else{
		sh.info(sh.caller("Execute() on empty sequence")));
	}
 }
 
 function execute(seq){
	
 }