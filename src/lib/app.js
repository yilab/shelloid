/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */

var express = require('express'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	sessionStore = require("shelloid-sessionstore"),
	multer = require("multer"),
	lusca = require("lusca"),
	path = require("path"),
	passport = require("passport");

exports.newInstance = function(appCtx){
	var staticPath = path.join(appCtx.basePath, 'public');
	var sessionName = appCtx.config.session.name;
	var sessionSecret = appCtx.config.session.secret;
	var uploadsDir = appCtx.config.uploadsDir;
			
	var app = express();
	app.use(express.static(staticPath));	
	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended:true}));
	app.use(multer({ dest: uploadsDir,
			rename: function (fieldname, filename) {
				return filename+Date.now();
			  },
			onFileUploadStart: function (file) {
			  console.log(file.originalname + ' is starting ...')
			},
			onFileUploadComplete: function (file) {
			  console.log(file.fieldname + ' uploaded to  ' + file.path)
			  done=true;
			}
		})
	);
	app.use(
		session({
			resave: true,
			saveUninitialized: true,
			name: sessionName,
			secret: sessionSecret,
			cookie: {
				httpOnly: false,
				maxAge: null,
				path: '/'
			},
			store: sessionStore.createSessionStore({
				dbname: appCtx.config.session.store
			})
		})
	);	
	app.use(passport.initialize());
	app.use(passport.session());	
	app.use(app.router);

	return app;
}