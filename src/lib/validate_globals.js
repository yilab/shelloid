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

global.num = function(v){
	return (typeof v) == "number";
}

global.array = function(v){
	return v.constructor == Array;
}

global.bool = function(v){
	return (typeof v) == "boolean";
}

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

global.any = function(){
	return true;
}

num.integer = function(v){
	return num(v) && ((v % 1) == 0);
}

num.integer.range = function(from, to){
	return function(v){
		return num.integer(v) && v >= from && v <= to;
	}
}

num.integer.max = function(to){
	return function(v){
		return num.integer(v) && v <= to;
	}
}

num.integer.min = function(from){
	return function(v){
		return num.integer(v) && v >= from;
	}
}

num.range = function(from, to){
	return function(v){
		return num(v) && v >= from && v <= to;
	}
}

num.max = function(to){
	return function(v){
		return num(v) && v <= to;
	}
}

num.min = function(from){
	return function(v){
		return num(v) && v >= from;
	}
}


array.bounded(spec, max){
	if(num(spec)){
		max = spec;
		spec = false;
	}
	
	return function(v, typeDef){
		return array(v) && v.length <= max && (!spec || validate.typeOk(v, spec));
	}	
}