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
	
	if(!ifc){
		return genericCheck(req.body, appCtx.config.validate.req, req) &&
			   genericCheck(req.query, appCtx.config.validate.req, req);
	}	

	if(req.body && ifc.body){
		if(!typeOk(req.body, ifc.body, appCtx.config.validate.req, req)){
			return false;
		}
	}
	
	if(req.query && ifc.query){
		if(!typeOk(req.query, ifc.query, appCtx.config.validate.req, req)){
			return false;
		}
	}
	
	return true;
}

exports.responseOk = function(req, res, obj, ifc, appCtx){
	if(!ifc){
		return genericCheck(obj, appCtx.config.validate.res, req, res);
	}
	
	if(ifc && ifc.body){
		if(!validate.typeOk(obj, ifc.body, appCtx.config.validate.res, req, res)){
			return false;
		}
	}
	return true;
}

function genericCheck(obj, config, req, res, opath){
	if(!config.safeStrings) return;//currently the only check.

	if(utils.isString(f) && !str.safe(f)){
		console.log("Unsafe string found (at: " + opath + ") in response to: " + req.url);
		return false;
	}

	for(var k in obj){
		if(!obj.hasOwnProperty(k)){
			continue;
		}
		
		opath = opath ? opath + "." + k : k;
		
		var f = obj[k];
		if(utils.isString(f) && !str.safe(f)){
			console.log("Unsafe string found (at: " + opath + ") in response to: " + req.url);
			return false;
		}else		
		if(utils.isObject(f)){
			genericCheck(f, config, req, res, opath);
		}else
		if(utils.isArray(f)){
			for(var i=0;i<f.length;i++){
				genericCheck(f[i], config, req, res, opath + "[" + i+ "]");
			}
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

function typeError(opath, req, requiredType, paramNotFound){
	if(!requiredType){
		if(paramNotFound){
			console.log("Invalid request to: " + req.url + 
						". Required parameter: " + opath + " not found");
		}else{
			console.log("Invalid request to: " + req.url + 
						". Unexpected parameter: " + opath + " found");		
		}
	}else{
		console.log("Invalid request to: " + req.url + ". Bad parameter type: " + 
					opath + ". Required: " + requiredType);	
	}
}

function typeOk(obj, typeDef, config, req, res, opath){

	if(utils.isFunction(typeDef)){
		var r = typeDef(v, config);
		if(!r){
			typeError(opath, req, typeDef.typename);	
			return false;
		}else{
			if(r !== true){
				return r;
			}else{
				return true;
			}
		}
	}
	
	for(var k in typeDef){
		if(!typeDef.hasOwnProperty(k)){
			continue;
		}
		if( (typeDef[k].constructor.name != "OptionalParam") && !obj[k]){
			typeError(opath, req, false, true);
			return false;
		}
	}

	for(var k in obj){
		opath = opath ? opath + "." + k : k;
		if(!obj.hasOwnProperty(k)){
			continue;
		}	
		var type = typeDef[k];
		var v = obj[k];
		if(type && type.constructor.name == "OptionalParam"){
			type = type.value;
		}
		if(!type){
			typeError(opath, req, false, false);	
			return false;
		}
		if(utils.isFunction(type)){
			var r = type(v, config);
			if(!r){
				typeError(opath, req, type.typename);	
				return false;
			}else if(r !== true){
				obj[k] = r;
			}
		}else if(utils.isArray(type)){
			if(type.length <= 0){
				typeError(opath, req, "empty array");
				return false;
			}
			if(utils.isArray(v)){
				for(var i=0;i<v.length;i++){
					if(!typeOk(v, type[0], config, req, res, opath + "[" + i + "]")){
						return false;
					}
				}
			}else{
				typeError(opath, req, "array");			
				return false;
			}
		}else if(utils.isObject(type)){
			if(utils.isObject(v)){
				if(!typeOk(v, type, config, req, res, opath)){
					return false;
				}
			}else{
				typeError(opath, req, "object");
				return false;
			}
		}		
	}	
	
	return true;
}

exports.typeOk = typeOk;
