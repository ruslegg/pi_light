var express = require("express");
var app = express();
const PORT = 3000;
var lightStatus = "sensor";
var luminosityLevel = 0;
var threshold = 0;
var https = require("https");
var http = require("http");
var fs = require("fs");
var CronJob = require("cron").CronJob;
var scheduledJobFrom = "";
var scheduledJobTo = "";
var scheduleStatus = false;
var isLightOn = false;
let config;
var certificates = {
  key: fs.readFileSync(__dirname + "/certs/privkey.pem"),
  cert: fs.readFileSync(__dirname + "/certs/fullchain.pem"),
};

  

const startLight = () => {
  var five = require("johnny-five"),
    board = new five.Board();

  board.on("ready", function () {

    // Initialization
    const relay = new five.Relay(2);
    let lightSensor = new five.Sensor({
      pin: "A0",
      freq: 3000,
      threshold: 5,
    });
    const jsonString = fs.readFileSync(__dirname + "/config.json");
  config = JSON.parse(jsonString);
  lightStatus = config.lightStatus;
  threshold = config.threshold;
  scheduleStatus = config.schedule.status;
  var dividedMinutesAndHours = config.schedule.from.split(":");
  scheduledJobFrom = new CronJob(
    dividedMinutesAndHours[1] + " " + dividedMinutesAndHours[0] + " * * *",
    function () {
      relay.off();
      lightStatus = "off";
      isLightOn = false;
      console.log("ranFrom");
    },
    null,
    scheduleStatus,
    "Europe/Copenhagen"
  );
  console.log(dividedMinutesAndHours);
  dividedMinutesAndHours = config.schedule.to.split(":");
  scheduledJobTo = new CronJob(
    dividedMinutesAndHours[1] + " " + dividedMinutesAndHours[0] + " * * *",
    function () {
      relay.off();
      lightStatus = "sensor";
      if (luminosityLevel <= threshold) {
        relay.on();
        isLightOn = true;
      }
      console.log("ran");
    },
    null,
    scheduleStatus,
    "Europe/Copenhagen"
  );
  console.log(dividedMinutesAndHours);
 
  
  console.log(
    `Threshold is ${threshold}, Light is ${lightStatus}, Schedule is from ${config.schedule.from} to ${config.schedule.to}, Schedule status is ${config.schedule.status}`
  );

    //Logic start
    lightSensor.on("change", function () {
      luminosityLevel = this.scaleTo(0, 100);
      if (
        lightStatus === "on" ||
        (lightStatus === "sensor" && luminosityLevel <= threshold)
      ) {
        relay.on();
        isLightOn = true;
      } else if (
        lightStatus === "off" ||
        (lightStatus === "sensor" && luminosityLevel > threshold)
      ) {
        relay.off();
        isLightOn = false;
      }
      console.log(
        `Light is now ${
          isLightOn ? "on" : "off"
        } Threshold is now: ${threshold}, Luminosity level is now ${luminosityLevel}`
      );
    });

    this.repl.inject({
      relay: relay,
    });

    app.use((req, res, next) => {
      if (req.secure) {
        next();
      } else {
        res.redirect("https://" + req.headers.host + req.url);
      }
    });

    app.get("/", (req, res) => {
      console.log("received request");
      res.sendStatus(404);
    });

    app.get("/manualLight/:mode", (req, res) => {
      const mode = req.params.mode;
      if (mode !== "on" && mode !== "off") {
        res.sendStatus(403);
      }
      lightStatus = mode;
      config.lightStatus = mode;
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
      if (lightStatus === "on") {
        relay.on();
        isLightOn = true;
      } else {
        relay.off();
      }
      console.log(`light: ${lightStatus}`);
      res.send({
        title: `Success`,
        message: `Light is ${lightStatus}`,
      });
    });

    app.get("/sensor", (req, res) => {
      lightStatus = "sensor";
      config.lightStatus = "sensor";
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));

      if (luminosityLevel <= threshold) {
        relay.on();
        isLightOn = true;
      } else {
        relay.off();
        isLightOn = false;
      }
      res.send({
        title: `Success`,
        message: `Light is sensor-based`,
      });
    });

    app.get("/switch", (req, res) => {
      var message = "";
      if (lightStatus === "on") {
        message = "on and manually triggered";
      } else if (lightStatus === "off") {
        message = "off";
      } else if (lightStatus === "sensor") {
        message = "on and sensor-based";
      }
      res.send({
        message: `Light is ${message}`,
      });
    });

    app.get("/luminositySensor", (req, res) => {
      var message = "";
      if (lightStatus === "sensor") {
        message =
          "on and luminosity level is at " + luminosityLevel + " percentage";
      } else {
        message = "off";
      }
      res.send({
        message: `Light based on luminosity sensor is now ${message}`,
      });
    });

    app.get("/threshold", (req, res) => {
      threshold = parseInt(luminosityLevel);
      config.threshold = parseInt(luminosityLevel);
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));

      relay.on();
      isLightOn = true;
      res.send({
        message: `Threshold has been changed to the current luminosity level: ${luminosityLevel}`,
      });
    });

    app.get("/schedule/:offFrom/:offTo", (req, res) => {
      const { offFrom, offTo } = req.params;
      if (scheduledJobFrom != "") {
        scheduledJobFrom.stop();
      }
      if (scheduledJobTo != "") {
        scheduledJobTo.stop();
      }
      let dividedMinutesAndHours = offFrom.split(":");
      scheduledJobFrom = new CronJob(
        dividedMinutesAndHours[1] + " " + dividedMinutesAndHours[0] + " * * *",
        function () {
          relay.off();
          lightStatus = "off";
          isLightOn = false;
          console.log("ranFrom");
        },
        null,
        scheduleStatus,
        "Europe/Copenhagen"
      );
      console.log(dividedMinutesAndHours);
      dividedMinutesAndHours = offTo.split(":");
      scheduledJobTo = new CronJob(
        dividedMinutesAndHours[1] + " " + dividedMinutesAndHours[0] + " * * *",
        function () {
          relay.off();
          lightStatus = "sensor";
          if (luminosityLevel <= threshold) {
            relay.on();
            isLightOn = true;
          }
          console.log("ran");
        },
        null,
        scheduleStatus,
        "Europe/Copenhagen"
      );
      console.log(dividedMinutesAndHours);
      config.schedule.from = offFrom;
      config.schedule.to = offTo;
      fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2 ));
      res.send({
        message: `Schedule set to switch off light from ${offFrom} to ${offTo}`,
      });
    });

    app.get("/scheduleStatus/:mode", (req, res) => {
      scheduleStatus = req.params.mode === 'true' ? true : false;
      config.schedule.status = req.params.mode === 'true' ? true : false;
      if (scheduleStatus === true) {
        scheduledJobFrom.start();
        scheduledJobTo.start();
      } else if (scheduleStatus === false) {
        scheduledJobFrom.stop();
        scheduledJobTo.stop();
      }
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
      res.send({
        message: 'Schedule set to ' + scheduleStatus
      })
    });

    var httpserver = http.createServer(certificates, app);
    var httpsserver = https.createServer(certificates, app);
    httpserver.listen(80, () => console.log("http server on"));
    httpsserver.listen(443, () => {});
    console.log(
      `Raspberry PI + Arduino server light controller listening at: http://localhost:${PORT}`
    );
  });
};

startLight();
