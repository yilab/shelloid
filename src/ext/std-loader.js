/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
 
module.exports = function(){
	return extInfo;
} 

var extInfo = 
{
	hooks:[	{type: "load", name: "auth", handler: authLoad},
			{type: "load", name: "routes", handle: routeLoad},
			{type: "load", name: "interfaces", handle: interfaceLoad}
	]
};

function authLoad(loader, mod){
	if(!appCtx.authMods){
		appCtx.authMods = [];
	}	
	appCtx.authMods.push(mod);
}

function authLoad(loader, mod){
	if(!appCtx.authMods){
		appCtx.authMods = [];
	}	
	appCtx.authMods.push(mod);
}

function routeLoad(loader, mod){
	if(!appCtx.routes){
		appCtx.routes = [];
	}	
	appCtx.routes.push(mod);
}

function interfaceLoad(loader, mod){
	if(!appCtx.interfaces){
		appCtx.interfaces = {};
	}	
	appCtx.interfaces[mod.url] = mod;
}
