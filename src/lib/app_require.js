var basePath = __dirname;
module.exports = function(param, setBase){
	if(setBase){
		basePath = param;
	}else{
		var m = require(basePath + "/node_modules/" + param);
		return m;
	}
}