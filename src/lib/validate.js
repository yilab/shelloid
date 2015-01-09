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

	var contentType = getContentType(ifc);
	if(contentType && (req.headers["content-type"] != contentType)){
		return false;
	}

	if(req.body && ifc && ifc.body){
		if(!typeOk(req.body, ifc.body, appCtx.config)){
			return false;
		}
	}
	
	if(req.query && ifc && ifc.query){
		if(!typeOk(req.query, ifc.query, appCtx.config)){
			return false;
		}
	}
	
	return true;
}

exports.getContentType = getContentType;

function getContentType(ifc){
	if(ifc){
		var contentType = false;
		if(ifc.contentType){
			contentType = ifc.contentType;
			if(shortContentTypes[contentType]){
				contentType = shortContentTypes[contentType];
			}			
		}else
		if(utils.isObject(ifc.body)){
			contentType = "application/json";
		}
		return contentType;
	}else{
		return false;
	}
}

var shortContentTypes = {
	"json" : "application/json",
	"html" : "text/html",
	"text" : "text/plain",
	"file" : "multipart/form-data"
};

function typeOk(obj, typeDef, config){
	for(var k in typeDef){
		if(!typeDef.hasOwnProperty(k)){
			continue;
		}
		if( (typeDef[k].constructor.name != "OptionalParam") && !obj[k]){
			return false;
		}
	}

	for(var k in obj){
		if(!obj.hasOwnProperty(k)){
			continue;
		}	
		var type = typeDef[k];
		var v = obj[k];
		if(type && type.constructor.name == "OptionalParam"){
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
