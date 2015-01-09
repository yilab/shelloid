/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var validate = lib_require("validate");
var moment = require("moment");

function OptionalParam(val){
	this.value = val;
}

global.optional = function(val){
	return new OptionalParam(val);
}

global.str = function(v){
	return toString.call(v) == '[object String]';
}

str.typename = "str";

global.num = function(v){
	return (typeof v) == "number";
}

num.typename = "num";

global.array = function(v){
	return v.constructor == Array;
}

array.typename = "array";

global.bool = function(v){
	return (typeof v) == "boolean";
}

bool.typename = "bool";

global.date = function(v, config){
	if(!str(v)){
		return false;
	}
	var m = moment(v);
	if(!m.isValid()){
		return false;
	}
	
	if(config.dateIsMoment)
		return m;
	else if(config.dateIsDate)
		return m.toDate();
	return true;	
}

date.typename = "date";

global.any = function(){
	return true;
}
any.typename = "any";

num.integer = function(v){
	return num(v) && ((v % 1) == 0);
}
num.integer.typename = "num.integer";

num.integer.range = function(from, to){
	var f = function(v){
		return num.integer(v) && v >= from && v <= to;
	}
	f.typename = "num.integer.range(" + from + "," + to + ")";	
	return f;	
}

num.integer.max = function(to){
	var f= function(v){
		return num.integer(v) && v <= to;
	};
	f.typename = "num.integer.max(" + to + ")";	
	return f;
}

num.integer.min = function(from){
	var f= function(v){
		return num.integer(v) && v >= from;
	};
	f.typename = "num.integer.min(" + from + ")";	
	return f;
}

num.range = function(from, to){
	var f = function(v){
		return num(v) && v >= from && v <= to;
	};
	f.typename = "num.range(" + from + "," + to + ")";
	return f;
}

num.max = function(to){
	var f = function(v){
		return num(v) && v <= to;
	};
	f.typename = "num.max(" + to + ")";
	return f;
}

num.min = function(from){
	var f = function(v){
		return num(v) && v >= from;
	};
	f.typename = "num.min(" + from + ")";
	return f;
}

array.bounded = function(spec, max){
	if(num(spec)){
		max = spec;
		spec = false;
	}
	
	var f = 
	function(v, typeDef){
		return array(v) && v.length <= max && (!spec || validate.typeOk(v, spec));
	};
	f.typename = "array.bounded(" + max + ")";
	return f;
}