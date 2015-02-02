; Copyright (c) Shelloid Systems LLP. All rights reserved.
; The use and distribution terms for this software are covered by the
; GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
; which can be found in the file LICENSE at the root of this distribution.
; By using this software in any fashion, you are agreeing to be bound by
; the terms of this license.
; You must not remove this notice, or any other, from this software.
 
(ns shelloid.mod-loader
    (:gen-class)	
    (:use 
		[bultitude.core 		:as   b]		
		shelloid.utils
    ) 
   (:require [clojure.string :as str])
   (:use clojure.test)
   (:import	(clojure.lang IPersistentMap) (java.io File))  	
)

(defn load-mod-syms [cfg]
   (let [
         load-syms (fn [ns]
                      (apply merge
                         (map 
                            #(hash-map (:name (meta %)) %)
                            (filter  
                               #(function? @%) 
                               (vals (ns-publics (symbol ns)))
                            )
                         )
                      )
                   )
       ]
       
       (apply merge 
          (map
            load-syms
            (:mod-ns cfg)
          )
        )
   )
)


(defn collect-services[services sym-info]
  (let [ mod-var     (second sym-info)
         svc-info   (:ccs (meta @mod-var))
         name       (:name svc-info)
        ]
        (if (string? name)
			(assoc services name {:name name :handler @mod-var})
            services  
        )
  )
)

(defn load-services[cfg]
   (let [mod-syms (load-mod-syms cfg)]
	  (doall
		 (reduce collect-services {} mod-syms)
	  )
   )
)

(defn load-mods [path]
	(dorun
		(map
			#(load-file (.toString %))
			(filter
				#(-> % .toString (.endsWith ".clj") )
				(file-seq (java.io.File. path))
			)
		)
	)
)
