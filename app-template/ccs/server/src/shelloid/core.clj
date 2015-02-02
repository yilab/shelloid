; Copyright (c) Shelloid Systems LLP. All rights reserved.
; The use and distribution terms for this software are covered by the
; GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
; which can be found in the file LICENSE at the root of this distribution.
; By using this software in any fashion, you are agreeing to be bound by
; the terms of this license.
; You must not remove this notice, or any other, from this software.
 
(ns shelloid.core
    (:gen-class :main true)	
    (:use 
        org.httpkit.server		
        [clojure.java.io :only [as-file]]		
		shelloid.utils
		shelloid.mod-loader
    ) 
	(:require [cheshire.core :refer :all])	
)

(def cfg  (atom {}))
(def services  (atom {}))
(def server (atom nil))
(defn app [req]
	(with-channel req channel
		(on-close channel (fn [status] (println "channel closed: " status))
		)
		(on-receive channel 
			(fn [data] 
				(let [parsed-json (parse-string data)
					  params      (parsed-json "params")
					  temp (println "PARAMS" params)
					  header      (parsed-json "header")
					  name        (header "service")
				      service (@services name)
					  reqid   (header "reqid")
					  res-header {"service" name "reqid" reqid}
				     ]
					 (if service
						(do
							(println "Processing service request for "
											name ", reqid " reqid)
							(future
							  (try
								(let [body (apply (:handler service) params)
									  res {"header" res-header "body" body}
									  res-json (generate-string res)
									 ]
									(send! channel res-json)
								)
								(catch Throwable e
								  (do
									(.printStackTrace e)
									(let [res-header 
											(assoc res-header "err" "Service Error")
										  res {"header" res-header "body" {}}
										  res-json (generate-string res)
										]
										(send! channel res-json)
									)
								  )
								)
							  )
							)
						)
						(let [res-header 
								(assoc res-header "err" "Service Not Found")
							  res {"header" res-header "body" {}}
							  res-json (generate-string res)
							]
							(send! channel res-json)
						)
					 )
				)
			)
		)
	)
)

(defn load-cfg [cfg-path]
	(reset! cfg  (load-string (str "(quote " (slurp cfg-path) ")")))				
	(when	(not (:port @cfg)) 
			(swap! cfg assoc :port 9090)
	)
	(when	(not (:ip @cfg)) 
			(swap! cfg assoc :ip "localhost")
	)
	(when	(not (:mod @cfg)) 
			(swap! cfg assoc :mod "mod")
	)
	(let [parent-path (-> cfg-path as-file .getAbsoluteFile .getParentFile)
		  mod-path    (.toString (java.io.File. parent-path (:mod @cfg)))
	    ]
		(swap! cfg assoc :mod-path mod-path)
        (if (not (dir-exists mod-path))
			(println "CCS mod directory does not exist: " mod-path)
			true
		)		
	)
)
 
(defn -main [& args]
  (try
  	(let [cfg-path (when (> (count args) 0) (first args) )]
        (when (not cfg-path)
              (println "Please specify config file path as argument")
			  (System/exit 0)
        )
        (if  (not (file-exists cfg-path))
             (println "Config file does not exist: " cfg-path)
             (do
				(when (not (load-cfg cfg-path))
					(println "Configuration error")
					(System/exit 0)
				)
				(load-mods (:mod-path @cfg))
				(reset! services (load-services @cfg))
				(println "Loaded services: " (keys @services))
                (reset! server (run-server #'app 
								{:ip (:ip @cfg) :port (:port @cfg)})
				)
				(println "Shelloid compute server running on port " (:port @cfg))
             )
        ) 
  	)
    (catch Throwable e
       (.printStackTrace e)
    )
  )
)
