/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var support;
var proxyBase = lib_require("db/proxy-base");

exports.init = function(supportThis){
	support = supportThis;
}

exports.createProxy = function(client){
	return new RedisProxy(client);
}

exports.ops = ["setex", "select", "del" , "keys"];

exports.createPool = function(config){
	var redis = support.mod;
	var createFn = 	function (callback) {
		config.port = config.port ? config.port : 6379;
		config.host = config.host ? config.host : "localhost";
		var client = redis.createClient(config.port, config.host);
		client.auth(config.password, function(err){
			callback(err, client);
		});
		client.on("error", function (err) {
			sh.error(sh.loc("Redis error for instance: " +config.name + ": "  + err));
		});
	};

	var destroyFn = function (client) {
		client.quit();
	};
	
	return proxyBase.createPool(config, createFn, destroyFn);
}

function RedisProxy(client){
	this.client = client;
}

RedisProxy.prototype = Object.create(proxyBase.ProxyBase.prototype);
