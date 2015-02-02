Shelloid
========

Shelloid is an open source web application server for Node.js that attempts to bring out the best of two cool modern programming platforms: Node.js and Clojure. Node.js is great for web and real-time. Clojure is great for concurrent computations. So, why not let the Node.js handle the web requests and real-time messaging and use Clojure when there is a heavy computation at hand? Shelloid does just that.

Shelloid is essentially a Node.js web application server with integrated Clojure-based compute service which runs as a separate process. Shelloid takes care of all the integration details. While the Clojure compute service is executing a heavy computation, Node.js event loop is freed up to process other requests.

The following code snippet illustrates how the integration works. In the code, we define a compute service named add in Clojure. From Node.js this service is invoked by calling sh.ccs.add function (sh stands for shelloid, ccs for Clojure compute service). This results in parameters being passed to the CCS process and the Clojure add service function being executed. The result of the Clojure function is passed back to Node.js and the callback is invoked with err message if any and the result value. After passing off the computation to the Clojure, Node.js event loop is freed up to execute other requests.

Node.js:
```javascript
	sh.ccs.add(100, 200, function(err, r){
	console.log("Result: " + r);
	});
```

Clojure
```clojure
	(service add [a b]
		(+ a b)
	)
```

Clojure compute service (CCS) requires Leiningen to be installed somewhere in the system path.

Please Note: More documentation is on the way. Please bear with us for couple of weeks!

Open, extensible architecture
===============================

Shelloid has an open, extensible architecture. While open sourcing is great for the users, Shelloid goes beyond merely being open source. Shelloid has a open architecture created from ground up, allowing you to easily write extensions that can modify the behaviour of the engine to suit your needs. Many of Shelloid's  built-in features are themselves built as extensions, leading to a relatively small and robust core.

Our vision is to simplify the development of secure and robust web applications and services, improving programmer productivity and enabling quick time-to-market. Shelloid takes care of the infrastructure logic and lets you focus on your business logic, leading to quick time to market for your business-critical applications. Shelloid is open sourced under LGPL license, allowing you to run your commercial closed source applications on the top of it.

Getting started
=================

Install: npm install -g shelloid 

Installation requires super user/admin privilege. Use "sudo" in Linux/unix and "Run as administrator" in Windows.

Initialize an app: shelloid test-app init

To run: shelloid test-app


Key features (at the moment):

* Use of annotations instead of writing code for many useful functions.

* Configurable automatic restarting of the server in case of changes to the application code or unrecoverable errors.

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

* UI themes can be associated with domains, i.e., depending on the domain by which the site is accessed a separate set of files/views can be served. Note that, at the moment, controllers are shared across domains. This results in a limited support for virtual hosting.

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


