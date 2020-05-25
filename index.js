var express = require("express");
var app = express();
const PORT = 3000;
var lightStatus = "off";
var luminositySensor = "on";
var luminosityLevel = 0;

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
    const luminosityPercentage = (luminosityLevel * 100) / 1023;
    message =
      " and luminosity level is at " + luminosityPercentage + " percentage";
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
