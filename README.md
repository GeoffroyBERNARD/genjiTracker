# genjiTracker

This is just a little node script that will fetch my stats from an Overwath api and generate a chart for me for every characters. If you want to copy it you just have to reset the data (All data is stored into save.json, you can juste empty it and refactor `BaronGOF-2402` by your Btag and `TheDebaser-21783` by your smurf account btag, and then `BaronGOF` by anything and `TheDebaser` by anything else (make sure you don't erase the btag by doing so).
If you don't own a second account, just put another btag but don't put the same twice as it can overwhelm the api.

first `git clone` the project and then `npm install` to install dependencies, then on the root folder just use one of these command line but always run `node app.js` on the first run to ensure everything is working correctly.

* to gather data once and exit run 
    `node app.js`

* to gather data once every hour run
    `node app.js listen`

* to serve charts without gathering data
    `node app.js server`

* to gather data once every hour run and serve charts 
    `node app.js listen server`
    
Charts are served at `localhost:8080/{heroname}` with {heroname} being `ana ashe bastion brigitte dva doomfist genji hanzo junkrat lucio mccree mei mercy moira orisa pharah reaper reinhardt roadhog soldier76 sombra symmetra torbjorn tracer widowmaker winston wrecking_ball zarya zenyatta`. (might not work for heroes that haven't been played yet). If you see that a hero is missing, you can add it on the heroes array (around line 14)

