Shelloid
========

The Node.js Web Application Server that simplifies the development of secure & dependable web applications/services.

In order to improve programmer productivity and make your code readable, maintainable, and secure, Shelloid employs the following foundational principles:

* Convention over configuration.

* Declarative over procedural.

* Separation of concerns.

* Secure defaults.

Getting started
=================

Install: npm install -g shelloid 

Installation requires super user/admin privilege. Use "sudo" in Linux/unix and "Run as administrator" in Windows.

Initialize an app: shelloid test-app init

To run: shelloid test-app


Key features (at the moment):

* Use of annotations instead of writing code for many useful functions.

* Built in authentication (via passport.js) - requires only a single authentication function to be written. 

* Currently supports local authentication as well as Google, Facebook, Twitter authentications out of the box.

* Custom authentication, e.g, for API implementations that is attached to routes via annotations.

* Built-in login session management.

* Built-in role-based access control with roles attached to controllers via annotations.

* Supports specification-based verification of API requests/responses. Simple API specification which is automatically checked against requests for enhanced security, robustness. The application code will be cleaner owing to lesser checks required.

* Built in cluster support by setting a single configuration flag. Builtin logging with cluster support.

* Simplified DB API with built-in connection pooling and close to synchronous-style programming.

* Support for declarative SQL query specifications as part of annotations. 

* Built in proper error and exception handling that takes care of sending error responses and freeing DB connections.

* Built in simple and versatile sequencing API that avoids callback hell and results in readily understandable code.

* Built-in simulator for controlled functional testing of application/controller logic (work in progress - please see sim/main.js in the shelloid-sample-app). Will support control of the flow of time as well as specification and verification of temporal properties.

* Simple config specification for allowing cross-origin requests (implementation complying with CORS standard).

* Auto detection of the current node of execution based on specified node names to IP/hostname mapping - useful for distributed and cloud deployments.

* Support for easily configurable application UI themes.

Currently the software is in alpha stage with featured being added on a daily (even hourly) basis. First full featured beta release is expected to happen in another week or so. After that we will be putting up more documentation.

The prelaunch web app (including its admin console) for the cloud log management platform for Shelloid (http://shelloid.com) is built using Shelloid.

This app is released in open source so that it can serve as a real-life (used by our live prelaunch site) but simple enough example. 

Installation:
=============

npm install -g shelloid


Sample app
============

git clone https://github.com/shelloid/shelloid-prelaunch-signup

Please note that you will need to get (1) Mailgun API key/secret, (2) Google OAuth2 client key/secret and specify in the configuration file. Also a Mysql database (schema available in src/db) will need to be created for storing signup information. 

Copy config.sample.json to config.json and make the necessary modifications.

Run:

shelloid shelloid-prelaunch-signup

This will start up the web application at port 8080. You can take a look at the sample application structure.

shelloid shelloid-prelaunch-signup sim [to try out the simulator - this is work in progress]

Please visit http://shelloid.org for more information and to register to Shelloid mailing list (low traffic).


