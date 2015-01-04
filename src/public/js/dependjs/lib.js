/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
 
function initView()
{
	showHashView();
	$(window).bind('hashchange', function () {
  		showHashView();
	});
}

function getCurrentView()
{
	var view = location.hash;
	if(view != '')
		view = view.substring(1); //remove '#'
	return view;
}

function setCurrentView(name, data)
{
	var currView = getCurrentView();
	if(currView == name)
		return;

	if(currView != '' && (views[currView].cleanupfn !== undefined))
		views[currView].cleanupfn();

	if(data !== undefined)
    {
        views[name].data = data;
    }
	location.hash = name;
}

function showHashView()
{
    var view = getCurrentView();
    if(view == '')
        view = views._default;
    var data = {};
    if (views[view] == undefined)
    {
        showToast("The specified view does not exists.");
    }
    else
    {
        var id;
        if (views[view].data != undefined)
        {
            data = views[view].data;
        }
        if (views[view].contentId != undefined)
        {
            id = views[view].contentId;
        }
        replacePartial(id, view, data);
    }
}

function addView(view)
{
    if(view == '')
        view = views._default;
    var data = {};
    var id = "body";
    if (views[view].data != undefined)
    {
        data = views[view].data;
    }
    if (views[view].contentId != undefined)
    {
        id = views[view].contentId;
    }
    replacePartial(id, view, data);
}

function registerForm(form)
{
	for(var field in form)
	{
		if(!form.hasOwnProperty(field))
			continue;
		if(isFunction(form[field]))
		{
			form.obj.find('#' + field).first().click(form[field]);
		}
	}
}

function fillModel(form, model)
{
	for (var field in model)
	{
		if(!model.hasOwnProperty(field))
			continue;
		var first = form.find('#' + field).first();
		if(first != undefined)
			model[field] = first.val();
	}
}

function fillDom(dom, model)
{
	for (var field in model)
	{
		if(!model.hasOwnProperty(field))
			continue;
		var first = dom.find('#' + field).first();
		if(first != undefined)
		{
			if(first.val != undefined)
				first.val(model[field]);
			else
				first.text(model[field]);
		}
	}
}

function doPost(path, json, successfn, errorfn)
{
	doRequest(path, json, "POST", successfn, errorfn, 0);
}

function doGet(path, params, successfn, errorfn)
{
	doRequest(path, params, "GET", successfn, errorfn, 0);
}

function doRequest(path, data, method, successfn, errorfn, nRetries)
{
	var maxRetries = 3;
    var realPath = path;
	if(nRetries === undefined)
		nRetries = 0;
    if(window.actualSite){
        path = window.actualSite + path;
    }
	var req = {type: method, url: path};
	if(method == "POST")
	{
		req.data = JSON.stringify(data);
		req.contentType = "application/json";
	}else
	if(method == "GET")
	{
		//TODO
		//data consists of key value pairs that must be converted to query string
	}

    req.timeout = 5000;
	$.ajax( req )
		.success(function(resp)
			{
				if(resp.error)
				{
					if(errorfn !== undefined)
						errorfn(resp);
					else
						showToast('Server returned error: ' + resp.error);
				}
				else
					successfn(resp);
			}
		)
		.fail(function(xhr, status, err) {

			if(Math.floor(xhr.status / 100) == 4)
			{
				if(errorfn !== undefined)
				{
					errorfn({error:xhr.status});
				}
				else {
                    if (xhr.status == 403) {
                        window.location = window.actualSite + "/?msgId=1";
                    }
                    else {
                        showToast("Server returned " + xhr.status + ".");
                    }
				}
			}
			else
			{
				if(nRetries < maxRetries)
				{
					console.log("request failed. retrying...");
					if(errorfn === undefined)
					{
						showToast("Request failed. Retrying...");
					}
					setTimeout(
	            		function(){
	            			doRequest(realPath, data, method,
	            			          successfn, errorfn, nRetries+1);
	            		}
	            		, 3000);
				}else
				{
					if(errorfn !== undefined)
					{
						errorfn({error:"timeout"});
					}
					else
					{
						showToast("Communication Error");
					}
				}
			}
		});
}

function replacePartial(id, name, data)
{
	var type =  window.views[name].type;
	var initfn = window.views[name].initfn;
	var path = "/partials/" + name + "." + type;
	doGet(path, {}, function(resp)
	{
		var content = resp;
		if(type == "ejs")
		{
			var template = new EJS({text: resp});
			if(data === undefined)
				data = {};
			content = template.render(data);
		}
		$('#' + id).html(content);
		if(initfn !== undefined)
			initfn(data);
	});
}

function showToast(msg, type, sticky, duration)
{
	//type: danger info success
    if(duration === undefined)
        duration = 3000;
	if(type === undefined)
		type = "danger";
	var options = {duration: duration, sticky: sticky,  type: type};
	$.toast(msg, options);
}

function isFunction(object) {
 return object && typeof object == 'function';
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}


var JSON = JSON || {};

JSON.stringify = JSON.stringify || function (obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string") obj = '"'+obj+'"';
		return String(obj);
	}
	else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
            if (obj.hasOwnProperty(n)) {
                v = obj[n];
                t = typeof(v);
                if (t == "string") v = '"' + v + '"';
                else if (t == "object" && v !== null) v = JSON.stringify(v);
                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};

JSON.parse = JSON.parse || function (str) {
	if (str === "") str = '""';
	eval("var p=" + str + ";");
	return p;
};

function storeJson(key, json)
{
	var key_ = "store_" + key;
	var value_ = JSON.stringify(json);
	if(localStorage === undefined)
	{
		$.cookie(key_, value_);
	}else
		localStorage.setItem(key_, value_)
}

function retrieveJson(key)
{
	var key_ = "store_" + key;
	var value;
	if(localStorage === undefined)
	{
		value = $.cookie(key_);
	}
    else
    {
		value = localStorage.getItem(key_);
    }
	if(value === undefined || value == "")
		value = "{}";
	return JSON.parse(value);
}

function deleteJson(key)
{
    var key_ = "store_" + key;
    if(localStorage === undefined)
    {
        $.removeCookie(key_);
    }
    else
    {
        window.localStorage.removeItem(key_);
    }
}

$.fn.exists = function () {
    return this.length !== 0;
};


function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

$(function(){
   $(".actualSite").each(function(index, elem){
       $(elem).attr("href", window.actualSite + $(elem).attr("href"));
   });
});