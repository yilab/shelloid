(ns test.ccs.testmod
	(:gen-class)
	(:use shelloid.service) 
)

(service add [a b]
	(do
	(println "Service add invoked")
	(+ a b)
	)
)