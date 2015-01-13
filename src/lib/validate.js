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
var util = require("util");

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
		if(!typeOk(obj, ifc.body, appCtx.config.validate.res, req, res)){
			return false;
		}
	}
	return true;
}

function genericCheck(obj, config, req, res, opath){
	
	if(!config.safeStrings) return true;//currently the only check.	
	
	if(utils.isString(obj)){
		if(!str.safe(obj)){
			console.log("Unsafe string found (at: " + opath + ") in response to: " + req.url + 
				". String: " + obj);
			return false;
		}
		return true;
	}else
	if(utils.isObject(obj)){
		for(var k in obj){
			if(!obj.hasOwnProperty(k)){
				continue;
			}			
			opath = opath ? opath + "." + k : k;
			
			if(!genericCheck(obj[k], config, req, res, opath)){
				return false;
			}
		}
		return true;
	}else
	if(utils.isArray(obj)){
		for(var i=0;i<obj.length;i++){
			if(!genericCheck(obj[i], config, req, res, opath + "[" + i+ "]")){
				return false;
			}
		}
		return true;
	}		
	/*shouldn't get here*/
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

function typeError(opath, req, res, requiredType, paramNotFound){
	var t = res ? "response" : "request";
	if(!requiredType){
		if(paramNotFound){
			console.log("Invalid " + t + " to: " + req.url + 
						". Required parameter: " + opath + " not found");
		}else{
			console.log("Invalid " + t + " to: " + req.url + 
						". Unexpected parameter: " + opath + " found");		
		}
	}else{
		console.log("Invalid " + t + " to: " + req.url + ". Bad parameter type: " + 
					opath + ". Required: " + requiredType);	
	}
}

function typeOk(obj, typeDef, config, req, res, opath){

	if(utils.isFunction(typeDef)){
		var r = typeDef(obj, config);
		if(!r){
			typeError(opath, req, res, typeDef.typename);	
			return false;
		}else{
			if(r !== true){
				return r;
			}else{
				return true;
			}
		}
	}
	
	if(utils.isObject(obj)){
		if(!utils.isObject(typeDef)){
			typeError(opath, req, res, typename(typeDef) );
			return false;
		}
		for(var k in typeDef){
			if(!typeDef.hasOwnProperty(k)){
				continue;
			}
			if( (typeDef[k].constructor.name != "OptionalParam") && !obj[k]){
				typeError(opath ? opath + "." + k : k, req, res, false, true);
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
				typeError(opath, req, res, false, false);	
				return false;
			}
			if(!typeOk(v, type, config, req, res, opath)){
				return false;
			}
		}
		return true;
	}else
	if(utils.isArray(obj)){
		if(!utils.isArray(typeDef)){
			typeError(opath, req, res, typename(typeDef) );
			return false;
		}
		if(typeDef.length == 0 && obj.length > 0){
			typeError(opath, req, res, "empty array");
			return false;
		}
		for(var i=0;i<obj.length;i++){
			if(!typeOk(obj[i], type[0], config, req, res, opath + "[" + i + "]")){
				return false;
			}
		}
		return true;
	}else{	
		typeError(opath, req, res, typename(typeDef));	
		return false;
	}
}

exports.typeOk = typeOk;

function typename(t){
	if(utils.isFunction(t)){
		return t.typename;
	}else
	if(utils.isArray(t)){
		return "array";
	}else
	if(utils.isObject(t)){
		return "obj";
	}else{
		return "<unknown type:" + t + ">";
	}	
}