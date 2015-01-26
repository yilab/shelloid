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
var path = require("path");
var liner = lib_require("liner");

exports.parseAnnotations = function(serverCtx, pathInfo, callback){
	var NONE = 0, SINGLE_QUOTED = 1, DOUBLE_QUOTED = 2, READING_KEY=3, READING_VALUE=4;
	var stringState = NONE;
	var annState = NONE;
	var inComment = false;
	var isDocComment = false;
	var annValue = "";
	var annKey = "";
	var charCodeA = "a".charCodeAt(0);
	var charCodeZ = "z".charCodeAt(0);
	var charCode0 = "0".charCodeAt(0);
	var charCode9 = "9".charCodeAt(0);
	var annotations = {
	};
	var annCurrent = {sql:{}};
	
	var idChar = function(c, extraSym){
		n = c.toLowerCase().charCodeAt(0);
		return c == "_" || c == "-" ||  (n >= charCodeA && n <= charCodeZ) 
						||	(n >= charCode0 && n <= charCode9) || c == extraSym;
	}
	var linerObj = liner();
	var src = fs.createReadStream(pathInfo.path);
	src.pipe(linerObj);
	
	var processLine = 
	function(line) {
		line = " " + line.trim();//we need to collapse to at least a single whitespace
		if(line == " "){
			return;
		}		
		var prevChar = "";
		var skipChars = 0;
		var lineLength = line.length;
		
		var k = 0;
		var exportsPrefix = " exports.";
		var functionPrefix = " function";
		if(!inComment){
			if(stringState == NONE && 
			  (line.startsWith(exportsPrefix) || line.startsWith(functionPrefix)) ){
				var id = "";			  
				if(line.startsWith(exportsPrefix)){
					for(k=exportsPrefix.length;k<lineLength;k++){
						if(idChar(line[k])){
							id += line[k];
						}else{
							break;
						}
					}
					annotations[id] = annCurrent;
				}else
				{
					for(k=functionPrefix.length+1;k<lineLength;k++){
						if(idChar(line[k])){
							id += line[k];
						}else{
							break;
						}						
					}
					var fnPath = path.normalize(pathInfo.path) + "/" + id;
					sh.annotations[fnPath] = annCurrent;
				}
				annCurrent = {sql:{}};
			}else{
				annCurrent = {sql:{}};
			}
		}
		
		for(var i=k;i<lineLength;i++){
			var annReady = false;
			if(skipChars > 0){
				skipChars--;
				continue;			
			}
			var nextChar = (i+1) < lineLength ? line[i+1] : "";
			var charProcessed = false;
			
			if(stringState != NONE){
				charProcessed = true;
				if(prevChar != '\\'){
					if(stringState == SINGLE_QUOTED && line[i] == "'"){
						stringState = NONE;						
					}else
					if(stringState == DOUBLE_QUOTED && line[i] == '"'){
						stringState = NONE;
					}						
				}
			}else{
				if(line[i] == "'"){
					stringState = SINGLE_QUOTED;
					charProcessed = true;
				}else
				if(line[i] == '"'){
					stringState = DOUBLE_QUOTED;
					charProcessed = true;
				}
			}
					
			if(stringState == NONE && !charProcessed){			
				if(inComment){
					//using lookahead to detect end of comment to simplify detecting end of annValue
					if(line[i] == '*' && nextChar == '/'){
						charProcessed = true;
						inComment = false;
						if(annState == READING_KEY){
							annState = NONE;
							annReady = true;
						}
						isDocComment = false;
						skipChars = 1;
					}else
					if(isDocComment && line[i] == '@'){
						charProcessed = true;
						if(annState != NONE){
							annReady = true;
						}else{
							annKey = "";
							annValue = "";
						}
						annState  = READING_KEY;
					}
				}else{
					if(line[i] == '/' && nextChar == '*'){
						charProcessed = true;
						skipChars = 1;
						inComment = true;
						annCurrent = {sql:{}};
						var nextNextChar = (i+2) < lineLength ? line[i+2] : "";
						if(nextNextChar == '*'){
							skipChars++;
							isDocComment = true;
						}
					}
				}
			}
			if(annState == READING_KEY && !charProcessed){				
				if(	idChar(line[i], ".")){
					annKey += line[i];
				}else{
					annState = READING_VALUE;
				}
			}
			
			if(annState == READING_VALUE){
				if(!inComment){
					annReady = true;
					annState = NONE;
				}else{
					annValue += line[i];
				}
			}
				
			if(annReady){
				annValue = annValue.trim();
				try{
					if(sh.ext.annotationProcessors[annKey]){
						sh.ext.annotationProcessors[annKey].process(
												annCurrent, annKey, annValue);
					}else{
						if(annValue == ""){
							annValue = "true";
						}
						eval("var v = " + annValue);
						annCurrent[annKey] = v;							
					}
					//TODO MOVE THIS TO EXT:
					var sqlPrefix = "sql.";
					if(annKey.startsWith(sqlPrefix)){
						var sqlName = annKey.substring(sqlPrefix.length);
						var v = annValue.replace(/\s+/g, ' ');
						annCurrent.sql[sqlName] = v;
					}
					
				}catch(err){
					console.log("ERR: Syntax error in the annotation value for @" 
								+ annKey + ": " + err + " in the file " + pathInfo.path + " Value: " + annValue);
					serverCtx.appCtx.hasErrors = true;
				}
				annKey = ""; 
				annValue = "";
				if(annState == READING_VALUE){
					annState = NONE;
				}
			}
			
			prevChar = line[i];
		}
	};	
	
	linerObj.on('readable', function () {
		var line;
		while (line = linerObj.read()) {
			processLine(line);
		}

	})
	
	linerObj.on("end", function(){
		callback(pathInfo, annotations);
	});
	
}


