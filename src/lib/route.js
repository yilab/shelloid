exports.add = function(app, ctrl){
	var urlPath = ctrl.url;
	if(ctrl.annotations["path"]){
		urlPath = ctrl.annotations["path"];
	}else if(ctrl.annotations["pathSuffix"]){
		var pathSuffix = ctrl.annotations["pathSuffix"];
		if(pathSuffix.startsWith("/")){
			urlPath = urlPath + pathSuffix;
		}else{
			urlPath = urlPath + "/" + pathSuffix;
		}
	}
	var method = "all";
	if(ctrl.annotations["method"]){
		method = ctrl.annotations["method"];
	}
	
	if(method.constructor == Array){
		for(var i=0;i<method.length;i++){
			console.log("Mounting " + ctrl.relPath + 
						" (" + ctrl.fnName + ") at " + urlPath + " (" + method[i] + ")");		
			app[method[i]](urlPath, ctrl.fn);
		}
	}else{
		console.log("Mounting " + ctrl.relPath + 
					" (" + ctrl.fnName + ") at " + urlPath + " (" + method + ")");
		app[method](urlPath, ctrl.fn);
	}
}
