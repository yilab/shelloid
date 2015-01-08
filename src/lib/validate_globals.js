global.OptionalParam = function(val){
	this.value = val;
}

global.optional = function(val){
	return new OptionalParam(val);
}

global.string = function(v){
	return toString.call(v) == '[object String]';
}

global.number = function(v){
	return (typeof v) == "number";
}

number.integer = function(v){
	return number(v) && ((v % 1) == 0);
}

global.bool = function(obj){
	return (typeof obj) == "boolean";
}