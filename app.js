const http = require('http');
const fs = require('fs');
const fetch = require('node-fetch');
const express = require('express')
const moment = require('moment');
const app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
let server = require("http").Server(app);

let config = {};

class Dataset{
    constructor(BaronGOF, TheDebaser, time){
        this.BaronGOF = BaronGOF;
        this.TheDebaser = TheDebaser;
        this.time = time;
    }
}

//Create a new dataset by running getData
function newDataset(){

    let time = Date.now();
    console.log("creating dataset " + time);

    getData('BaronGOF-2402').then(function(data){
        let BaronGOF = data;
        if (data && data.eu){
            console.log("pausing 30secs to avoid overwhelming API");
            setTimeout(function(){
                
                getData('TheDebaser-21783').then(function(data){
                    let TheDebaser = data;
                    if (data && data.eu){
                        let dataset = new Dataset(BaronGOF, TheDebaser, time);
                        console.log("dataset created successfully " + time);
                        saveDataset(dataset);
                    } else {
                        if (process.argv[2] == "listen"){
                            console.log("data gathering failed for TheDebaser-21783");
                            console.log("the app will try gathering data again automatically in 1h")
                            console.log("else you can restart the app")
                        }
                        else{
                            console.log("data gathering failed for TheDebaser-2178");
                            console.log("try again in a few moments");
                        }
                    }
                });
            },30000)
        } else {
            if (process.argv[2] == "listen"){
                console.log("data gathering failed for BaronGOF-2402");
                console.log("the app will try gathering data again automatically in 1h")
                console.log("else you can restart the app")
            }
            else{
                console.log("data gathering failed for BaronGOF-2402");
                console.log("try again in a few moments");
            }
        }
    });
}

//add the dataset to the file save.json
function saveDataset(dataset){

    fs.readFile('save.json', function (err, data) {
        if (err) {
            console.log("error reading file");
            console.log(err);
           return false
        }
        console.log("datasets read successfully");


        let datasets = data;

        if (datasets !== false){

            if (!datasets){
                datasets = [];
            }
            else datasets = JSON.parse(datasets);
    
             datasets.push(dataset);
             console.log("there are now " + datasets.length + " datasets" )
    
             datasets = JSON.stringify(datasets);
    
             fs.writeFile('save.json', datasets , function(err) {
                if (err) {
                   return console.error(err);
                }
                console.log("datasets written successfully");
                console.log("preparing config");
                //if server then update
                if (process.argv[3] == "server") {getDatasets();}
            });
         }
     });  
}

// return config for chartJs
function getDatasets(){
    return fs.readFile('save.json', function (err, data) {
        if (err) {
            console.log("error reading file");
            console.log(err);
           return false
        }
        console.log("datasets read successfully for display");

        let datasets = data;

        let TheDebaser = [];
        let BaronGOF = [];
        let time = [];

        if (datasets !== false){

            if (datasets){
                datasets = JSON.parse(datasets);

                for (let indexDatasets = 0; indexDatasets < datasets.length; indexDatasets ++){

                    //if at least on change on the values
                    if (indexDatasets > 0){
                        if (datasets[indexDatasets - 1].BaronGOF.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy != datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy
                            || datasets[indexDatasets - 1].TheDebaser.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy != datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy
                        ){
                            BaronGOF.push(datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy);
                            TheDebaser.push(datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy);
                            time.push(datasets[indexDatasets].time);
                        }
                    }
                    else{
                        BaronGOF.push(datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy);
                        TheDebaser.push(datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive.genji.general_stats.weapon_accuracy);
                        time.push(moment(datasets[indexDatasets].time).fromNow());
                    }
                }

                config = {
                    type: 'line',
                    data: {
                        labels: time,
                        datasets: [{
                            label: 'BaronGOF',
                            backgroundColor: "red",
                            borderColor: "red",
                            data: BaronGOF,
                            fill: false
                        }, {
                            label: 'TheDebaser',
                            fill: false,
                            backgroundColor: "blue",
                            borderColor: "blue",
                            data: TheDebaser
                        }]
                    },
                    options: {
                        responsive: true,
                        title: {
                            display: true,
                            text: 'Chart.js Line Chart'
                        },
                        tooltips: {
                            mode: 'index',
                            intersect: false,
                        },
                        hover: {
                            mode: 'nearest',
                            intersect: true
                        },
                        scales: {
                            xAxes: [{
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Temps'
                                }
                            }],
                            yAxes: [{
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Accuracy'
                                }
                            }]
                        }
                    }
                }

                console.log("config prepared for display");
            }
        }
    });  
}

//return data or false if error
function getData(battletag){
    let url = 'https://owapi.net/api/v3/u/' + battletag + '/blob';

    console.log("fetching data for " + battletag);

    return fetch(url).then(function(data) {
        data = data.json();
        return data;
    }).then(function(data) {

        if (data.error == 429) {
            console.log("error 429 fetching " + battletag);
            return false;
        } else if (data.error == 500) {
            console.log("error 500 fetching " + battletag);
            return false;
        }
        else{
            console.log("data gathered successfully for " + battletag);
            return data;
        }
    });

}

function runOnce(){
    newDataset();
}
function runEveryHours(){
    newDataset();
    setInterval(newDataset,3600000);
}






if (process.argv[2] == "listen"){
    console.log("gathering data every hours, use no arguments to only gather once, starting in 10s");
    setTimeout(runEveryHours,10000);
}
else if (process.argv[2]){
    console.log("wrong argument, use 'listen' to gather data every hours or nothing to gather data only once");
}
else {
    console.log("gathering data once, use 'listen' to keep gathering data every hours");
    runOnce();
}

if (process.argv[3] == "server"){

    console.log("preparing the server");

    getDatasets();

    app.get('/', function (req, res) {
        console.log("rendering datas")
        res.render("index", { 'config': JSON.stringify(config)  });
    });
      
    server.listen(8080);

    console.log("server ready");
}





