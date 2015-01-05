/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
var fs = require("fs");
 
exports.is = function (obj, type) {
    var clz = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clz === type;
}

exports.recurseDirSync = function(path){
	var res = [];
	var maxRecurse = 50;
	recursiveDirSync2(path, false, res, maxRecurse);
	return res;
}

exports.dirExists = function(path){
	var isDirectory = false;
	try{
		isDirectory = fs.lstatSync(path).isDirectory();
	}catch(err){
	}
	return isDirectory;
}

exports.fileExists = function(path){
	var isFile = false;
	try{
		isFile = fs.lstatSync(path).isFile();
	}catch(err){
	}
	return isFile;
}

exports.merge = function(obj1, obj2){
	return mergeRecursive(obj1, obj2);
}

exports.isAbsolutePath = function(path){
	return path.startsWith("/") || path.startsWith("\\") || (path.search(/.:[\/\\]/) >= 0)
}

function mergeRecursive(obj1, obj2) {
  for (var p in obj2) {
    try {
      if ( obj2[p].constructor==Object ) {
        obj1[p] = mergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      obj1[p] = obj2[p];
    }
  }

  return obj1;
}

function recursiveDirSync2(path, relPath, res, remRecurse){
	if(remRecurse <= 0){
		throw new Error("recursiveDirSync: Maximum recursion depth reached");
	}
	
	var entries = fs.readdirSync(path);
	for(var i =0;i<entries.length;i++){
		if(entries[i] != "." && entries[i] != ".."){
			var entryPath = path + "/" + entries[i];
			entryRelPath = relPath ? relPath + "/" + entries[i] : entries[i];
			var stat = fs.lstatSync(entryPath);
			if(stat.isDirectory()){
				recursiveDirSync2(entryPath, entryRelPath, res, remRecurse - 1 );
			}else
			if(stat.isFile()){
				res.push({path: entryPath, relPath: entryRelPath});
			}
		}
	}
}