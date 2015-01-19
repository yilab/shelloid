/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var url = require("url");
var path = require("path");
var utils = lib_require("utils");
var fs = require("fs");
module.exports = function(req, res, next){
	var reqPath = url.parse(req.url).pathname;
	var skinnedPublic = sh.appCtx.config.dirs.skinnedPublic;
	var skinPath = path.join(skinnedPublic, reqPath);
	var ext = path.extname(reqPath);
	if(utils.dirExists(skinPath)){
		
		skinPath = path.join(skinPath, "index.html");
		ext = ".html";
	}
	if(utils.fileExists(skinPath) && contentType[ext]){
		fs.stat(skinPath, function(err, stat){
			if(err){
				console.log("Could not stat skin file: " + skinPath + ". Falling back to default folder.");
				next();
			}else{
				res.statusCode = 200;
				res.setHeader("Content-Type", contentType[ext]);			
				res.setHeader("Content-Length", stat.size);
				var readStream = fs.createReadStream(skinPath);
				readStream.pipe(res);
			}
		});
	}else{
		next();
	}
} 

var contentType = {
	".css": "text/css",
	".html": "text/html",
	".htm": "text/html",	
	".txt": "text/plain",
	".js" : "application/javascript",
	".png" : "image/png",
	".jpeg" : "image/jpeg",
	".jpg" : "image/jpeg",
	".gif" : "image/gif",
	".ico" : "image/x-icon"
}
