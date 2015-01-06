var express = require('express'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	sessionStore = require("sessionstore"),
	multer = require("multer"),
	lusca = require("lusca"),
	path = require("path");

exports.newInstance = function(appCtx){
	var staticPath = path.join(appCtx.basePath, 'public');
	var sessionName = appCtx.config.session.name;
	var sessionSecret = appCtx.config.session.secret;
	var uploadsDir = appCtx.config.uploadsDir;
			
	var app = express();
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
			store: sessionStore.createSessionStore()
		})
	);	
	app.use(app.router);
	app.use(express.static(staticPath));
	return app;
}