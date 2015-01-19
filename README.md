Shelloid
========

The Node.js Web Application Server that simplifies the development of secure & dependable web applications/services.

Features built-in simulator for controlled functional testing of application/controller logic.

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

* Built in proper error and exception handling that takes care of sending error responses and freeing DB connections.

* Built in simple and versatile sequencing API that avoids callback hell and results in readily understandable code.

* Built-in simulator for controlled functional testing of application/controller logic (work in progress - please see sim/main.js in the shelloid-sample-app). Will support control of the flow of time as well as specification and verification of temporal properties.

* Simple config specification for allowing cross-origin requests (implementation complying with CORS standard).

* Auto detection of the current node of execution based on specified node names to IP/hostname mapping - useful for distributed and cloud deployments.

* Support for easily configurable application UI themes.

Currently the software is in alpha stage with featured being added on a daily (even hourly) basis. First full featured beta release is expected to happen in another week or so. After that we will be putting up more documentation.

Meanwhile you could try this to get an idea of the platform:

npm install -g shelloid

git clone https://github.com/shelloid/shelloid-sample-app.

shelloid shelloid-sample-app

This will start up the web application at port 8080. You can take a look at the sample application structure.

shelloid shelloid-sample-app sim [to try out the simulator - this is work in progress]

Please visit http://shelloid.org for more information and to register to Shelloid mailing list (low traffic).


