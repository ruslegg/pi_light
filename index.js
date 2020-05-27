  var express = require("express");
  var app = express();
  const PORT = 3000;
  var lightStatus = "sensor";
  var luminositySensor = "on";
  var luminosityLevel = 0;
  var threshold = 0;
  var init = true;
  var https = require('https'); 
  var http = require('http'); 
  var fs = require('fs');
  var CronJob = require('cron').CronJob;
  var scheduledJobFrom = '';
  var scheduledJobTo = '';
  var isLightOn = false;
  var options = {
    key: fs.readFileSync(__dirname + '/certs/privkey.pem'),
    cert: fs.readFileSync(__dirname + '/certs/fullchain.pem'),

  }
  var schedule = {};
  var five = require("johnny-five"),
      board = new five.Board();
  
  board.on("ready", function() {
    console.log('here again');  
  
    const relay = new five.Relay(2)
  
    let lightSensor = new five.Sensor({
      pin:  "A0",
      freq: 250,
      threshold: 5
    })
    lightSensor.on("change", function () {
      luminosityLevel = this.scaleTo(0,100);
  
      if (init) {
        threshold = luminosityLevel;
        init = false;
      }
      if (lightStatus === 'on' || lightStatus === 'sensor' && luminosityLevel <= threshold) {
        relay.on();
        isLightOn = true;
      }
      else if (lightStatus === 'off' || lightStatus === 'sensor' && luminosityLevel > threshold) {
        relay.off();
        isLightOn = false;
      }
      console.log(`Light is now ${isLightOn ? 'on' : 'off'} Threshold is now: ${threshold}, Luminosity level is now ${luminosityLevel}`);

    })
    // Create an Led on pin 13
    this.repl.inject({
      relay: relay
    });

  app.use((req, res, next) => {
    if (req.secure) {
      next();
    } else {
      res.redirect('https://' + req.headers.host + req.url);
    }
  })
    
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
    if (lightStatus === 'on') {
      relay.on();
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
    lightStatus = 'sensor';
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
    var message = '';
    if (lightStatus === 'on') {
      message = 'on and manually triggered'
    } else if (lightStatus === 'off') {
      message = 'off';
    } else if (lightStatus === 'sensor') {
      message = 'on and sensor-based';
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
      message = 'off';
    }
    res.send({
      message: `Light based on luminosity sensor is now ${message}`,
    });
  });

  app.get("/threshold", (req, res) => {
    threshold = parseInt(luminosityLevel);
    relay.on();
    isLightOn = true;
    res.send({
      message: `Threshold has been changed to the current luminosity level: ${luminosityLevel}`,
    });
  });

  app.get("/schedule/:offFrom/:offTo", (req, res) => {
    const {offFrom, offTo} = req.params;
    if (scheduledJobFrom != '') {
      scheduledJobFrom.stop();
    }
    if (scheduledJobTo != '') {
      scheduledJobTo.stop();
    }
    let dividedString = offFrom.split(':');
    scheduledJobFrom = new CronJob(dividedString[1] + ' ' + dividedString[0] + ' * * *', function() {
      relay.off();
      lightStatus = 'off';
      isLightOn = false;
      console.log('ranFrom')
    }, null, true, 'Europe/Copenhagen');
    console.log(dividedString);
    dividedString = offTo.split(':');
    scheduledJobTo = new CronJob(dividedString[1] + ' ' + dividedString[0] + ' * * *', function(){
      relay.off();
      lightStatus = 'sensor';
      if (luminosityLevel <= threshold) {
        relay.on();
        isLightOn = true;
      }
      console.log('ran');
    }, null, true, 'Europe/Copenhagen');
    console.log(dividedString);

    res.send({
      message: `Schedule set to switch off light from ${offFrom} to ${offTo}`
    })
  });
  
  
  var httpserver = http.createServer(options,app);
  var httpsserver = https.createServer(options, app);
  httpserver.listen(80, () =>
    console.log('http server on')
  );
  httpsserver.listen(443, () => {
  })
  console.log(
    `Raspberry PI + Arduino server light controller listening at: http://localhost:${PORT}`
  )
  });
