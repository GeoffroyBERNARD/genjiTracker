# genjiTracker
gathering stats hourly from overwatchAPI


* to gather data once run 
    `node app.js`

* to gather data once every hour run
    `node app.js listen`

* to gather data once every hour run and serve chart to localhost:8080
    `node app.js listen server`
    
all data is stored into save.json, empty it to reset data
you can change the battletags in the code if you want to
