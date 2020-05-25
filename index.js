var express = require("express");
var app = express();
const PORT = 3000;
var lightStatus = "off";
var luminositySensor = "on";
var luminosityLevel = 0;
var threshold = 0;
var init = true;


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
    console.log(`Light is now ${lightStatus}, Luminosity sensor is now ${luminositySensor}, Threshold is now: ${threshold}, Luminosity level is now ${luminosityLevel}`);

    if (init) {
      threshold = luminosityLevel;
      init = false;
    }
    if (lightStatus === 'on') {
      return relay.on();
    }
    if (luminositySensor === 'on' && luminosityLevel <= threshold) {
      relay.on();
    }
    else if (luminositySensor === 'off' || luminosityLevel > threshold) {
      relay.off();
    }
  })
  // Create an Led on pin 13
  this.repl.inject({
    relay: relay
  });
  
  var led = new five.Led(13);

  // Strobe the pin on/off, defaults to 100ms phases
  led.strobe(1000);
  // respond with "hello world" when a GET request is made to the homepage
app.get("/", (req, res) => {
  console.log("received request");
  res.sendStatus(404);
});

app.get("/switch/:mode", (req, res) => {
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

app.get("/switch", (req, res) => {
  res.send({
    message: `Light is ${lightStatus}`,
  });
});

app.get("/luminositySensor", (req, res) => {
  var message = "";
  if (luminositySensor === "on") {
    message =
      " and luminosity level is at " + luminosityLevel + " percentage";
  }
  res.send({
    message: `Light based on luminosity sensor is now ${luminositySensor}${message}`,
  });
});

app.get("/luminositySensor/:mode", (req, res) => {
  const mode = req.params.mode;
  if (mode !== "on" && mode !== "off") {
    res.sendStatus(403);
  }
  luminositySensor = mode;
  res.send({
    title: `Success`,
    message: `Light based on luminosity sensor is set to ${luminositySensor}`,
  });
});

app.listen(PORT, () =>
  console.log(
    `Raspberry PI + Arduino server light controller listening at: http://localhost:${PORT}`
  )
);
  
});