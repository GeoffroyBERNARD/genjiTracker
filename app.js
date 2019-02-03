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

let heroes = ["ana" , "ashe", "bastion", "brigitte", "dva", "doomfist", "genji", "hanzo", "junkrat", "lucio", "mccree", "mei", "mercy", "moira", "orisa", "pharah", "reaper", "reinhardt", "roadhog", "soldier76", "sombra", "symmetra", "torbjorn", "tracer", "widowmaker", "winston", "wrecking_ball", "zarya", "zenyatta" ]

let configs = {

}

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

        console.log("datasets :" + data);

        let datasets = data;

        if (datasets !== false){

            if (!datasets || datasets == ""){
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
                if (process.argv[3] == "server") {getAllDatasets();}
            });
        }
     });  
}


//get the datasets and setUp configs
function getAllDatasets(){

    fs.readFile('save.json', function (err, data) {
        if (err) {
            console.log("error reading file");
            console.log(err);
           return false
        }
        console.log("datasets read successfully for display");

        let datasets = data;

        if (datasets !== false){

            if (datasets){
                datasets = JSON.parse(datasets);
                for (heroesIndex = 0; heroesIndex < heroes.length; heroesIndex++){
                    getDatasets(heroes[heroesIndex], datasets)
                }
            }
        }
    });
}

// calculate configs for chart js based on the hero and the datasets
function getDatasets(hero, datasets){

    let TheDebaserAccuracy = [];
    let BaronGOFAccuracy = [];
    let TheDebaserWinrate = [];
    let BaronGOFWinrate = [];
    let time = [];

                //for each datasets
                for (let indexDatasets = 0; indexDatasets < datasets.length; indexDatasets ++){

                    //if the hero has been played on both account
                    if (datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive[hero] && datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive[hero] ){
                        let BaronGOFGames = datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive[hero].general_stats.games_played;
                        let BaronGOFWins = 0
                        if (datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive[hero].general_stats.games_won){
                            BaronGOFWins = datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive[hero].general_stats.games_won;
                        }
                        let BaronGOFWinrateTemp = Math.round( ((BaronGOFWins / BaronGOFGames ) * 100) * 10 ) / 10;

                        let TheDebaserGames = datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive[hero].general_stats.games_played;
                        let TheDebaserWins = 0
                        if (datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive[hero].general_stats.games_won){
                            TheDebaserWins = datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive[hero].general_stats.games_won;
                        }
                        let TheDebaserWinrateTemp = Math.round( ((TheDebaserWins / TheDebaserGames ) * 100) * 10 ) / 10;

                        //if at least on change on the values
                        if (indexDatasets > 0){
                            if (datasets[indexDatasets - 1].BaronGOF.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy != datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy
                                || datasets[indexDatasets - 1].TheDebaser.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy != datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy
                            ){
                                BaronGOFAccuracy.push((datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy * 100));
                                TheDebaserAccuracy.push((datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy * 100));
                                time.push(datasets[indexDatasets].time);

                                BaronGOFWinrate.push(BaronGOFWinrateTemp);
                                TheDebaserWinrate.push(TheDebaserWinrateTemp);
                            }
                        }
                        else{
                            BaronGOFAccuracy.push((datasets[indexDatasets].BaronGOF.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy * 100));
                            TheDebaserAccuracy.push((datasets[indexDatasets].TheDebaser.eu.heroes.stats.competitive[hero].general_stats.weapon_accuracy * 100));
                            time.push(moment(datasets[indexDatasets].time).fromNow());
                            BaronGOFWinrate.push(BaronGOFWinrateTemp);
                            TheDebaserWinrate.push(TheDebaserWinrateTemp);
                        }
                    }
                }

                configs[hero] = {
                    type: 'line',
                    data: {
                        labels: time,
                        datasets: [{
                            label: 'Baron Accuracy',
                            backgroundColor: "red",
                            borderColor: "red",
                            data: BaronGOFAccuracy,
                            fill: false
                        }, {
                            label: 'Debaser Accuracy',
                            fill: false,
                            backgroundColor: "blue",
                            borderColor: "blue",
                            data: TheDebaserAccuracy
                        },
                        {
                            label: 'Baron Winrate',
                            backgroundColor: "pink",
                            borderColor: "pink",
                            data: BaronGOFWinrate,
                            fill: false
                        }, {
                            label: 'Debaser Winrate',
                            fill: false,
                            backgroundColor: "purple",
                            borderColor: "purple",
                            data: TheDebaserWinrate
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
                                },
                                ticks: {
                                    beginAtZero: true,
                                    steps: 5,
                                    stepValue: 1,
                                    max: 100
                                }
                            }]
                        }
                    }
                }

                console.log("config for " + hero + " prepared for display");
            }


//return data or false if error
function getData(battletag){
    let url = 'https://owapi.net/api/v3/u/' + battletag + '/heroes';

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
        } else if (data.eu.heroes.stats.competitive){
            console.log("error 500 no data fetching " + battletag);
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
else if (process.argv[2] == "server"){
    console.log("serving current data");

    console.log("preparing the server");

    getAllDatasets();

    app.get('/:hero', function (req, res) {
        if (!req.params.hero) req.params.hero = "genji";
        console.log("rendering datas")
        res.render("index", { 'config': JSON.stringify(configs[req.params.hero]), 'hero' : req.params.hero  });
    });
      
    server.listen(8080);

    console.log("server ready");
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

    getAllDatasets();

    app.get('/:hero', function (req, res) {
        if (!req.params.hero) req.params.hero = "genji";
        console.log("rendering datas")
        res.render("index", { 'config': JSON.stringify(configs[req.params.hero]), 'hero' : req.params.hero  });
    });
      
    server.listen(8080);

    console.log("server ready");
}





