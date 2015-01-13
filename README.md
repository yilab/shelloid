Shelloid
========

The Simple & Secure Node.js Web Application Server.
Features OWASP-compliant functions.

Key features (at the moment):

* Use of annotations instead of writing code for many useful functions.

* Built in authentication (via passport.js) - requires only a single authentication function to be written. 
** Currently supports local authentication as well as Google, Facebook, Twitter authentications out of the box.

* Built-in login session management.

* Supports specification-based verification of API requests/responses. Simple API specification which is automatically checked against requests for enhanced security, robustness. The application code will be cleaner owing to lesser checks required.

* Built in cluster support by setting a single configuration flag. Builtin logging with cluster support.

* Simplified DB API with built-in connection pooling.

Currently the software is in very early alpha stage with featured being added on a daily (even hourly) basis. First full featured alpha release is expected to happen in a week or so. After that I will be putting up more documentation.

Meanwhile you could try this to get an idea of the platform:

npm install -g shelloid

git clone https://github.com/shelloid/shelloid-sample-app.

shelloid shelloid-sample-app

This will start up the web application at port 8080. You can take a look at the sample application structure.

Please visit http://shelloid.org for more information and to register to Shelloid mailing list (low traffic).


