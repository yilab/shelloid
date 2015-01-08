var utils = lib_require("utils");

exports.requestOk = function(req, ifc){	
	var structOk = true;
	
	if(req.body && ifc && ifc.body){
		validateStructure(req.body, ifc.body);
	}
	
	if(req.query && ifc && ifc.query){
		validateStructure(req.query, ifc.query);
	}
	
	return structOk;
}

function validateStructure(obj, typeDef){
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
			if(!type(v, obj)){
				return false;
			}
		}else if(utils.isArray(type)){
			if(type.length <= 0){
				return false;
			}
			if(utils.isArray(v)){
				for(var i=0;i<v.length;i++){
					if(!validateStructure(v, type[0])){
						return false;
					}
				}
			}else{
				return false;
			}
		}else if(utils.isObject(type)){
			if(utils.isObject(v)){
				if(!validateStructure(v, type)){
					return false;
				}
			}else{
				return false;
			}
		}		
	}	
	
	return true;
}

exports.validateStructure = validateStructure;
