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

exports.requestOk = function(req, ifc, appCtx){	
	var validated = true;
	
	if(req.body && ifc && ifc.body){
		validated = typeOk(req.body, ifc.body, appCtx.config);
	}
	
	if(req.query && ifc && ifc.query){
		validated = typeOk(req.query, ifc.query, appCtx.config);
	}
	
	return validated;
}

function typeOk(obj, typeDef, config){
	for(var k in typeDef){
		if(obj[k].constructor != OptionalParam){
			return false;
		}
	}
	
	for(var k in obj){
		var type = typeDef[k];
		var v = obj[k];
		if(type && type.constructor == OptionalParam){
			type = type.value;
		}
		if(!type){
			return false;
		}
		if(utils.isFunction(type)){
			var r = type(v, config)
			if(!r){
				return false;
			}else if(!bool(r)){
				obj[k] = r;
			}
		}else if(utils.isArray(type)){
			if(type.length <= 0){
				return false;
			}
			if(utils.isArray(v)){
				for(var i=0;i<v.length;i++){
					if(!typeOk(v, type[0], config)){
						return false;
					}
				}
			}else{
				return false;
			}
		}else if(utils.isObject(type)){
			if(utils.isObject(v)){
				if(!typeOk(v, type, config)){
					return false;
				}
			}else{
				return false;
			}
		}		
	}	
	
	return true;
}

exports.typeOk = typeOk;
