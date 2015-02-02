(defproject shelloid-ccs "0.1.0-SNAPSHOT"
  :description "Shelloid Clojure Compute Service"
  :url "http://shelloid.org"
  :license {:name "GNU Lesser General Public License Version 3"
            :url "https://www.gnu.org/licenses/lgpl.html"}
  :dependencies [
	[org.clojure/clojure "1.6.0"]
	[http-kit "2.1.18"]
	[cheshire "5.4.0"]
	[bultitude "0.2.6"]
  ]
  :main ^:skip-aot shelloid.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
