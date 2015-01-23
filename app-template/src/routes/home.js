/**
*/
exports.index = function(req, res, ctx){
	res.render("/home", {appName: ctx.app.packageJson.name});
}

