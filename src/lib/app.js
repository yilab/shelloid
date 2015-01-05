var express = require('express'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	cookieSession = require('cookie-session'),
	multer = require("multer");

exports.newInstance = function(staticPath, cookieKey, uploadsDir){
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
	app.use(cookieSession({secret: cookieKey}));	
	app.use(app.router);
	app.use(express.static(staticPath));
	return app;
}