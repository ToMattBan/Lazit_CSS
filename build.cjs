var fs = require("fs");

var lazitConfigs = {};

var throwError = function (error) {
  console.error(error);
  throw error;
};

var readJsons = function () {
  var defaultJson = {};
  fs.readFile("./lazit_default.conf.json", "utf8", function (err, data) {
    if (err) return throwError("Couldn't read the default json file");
    if (!data) return throwError("Couldn't get the default JSON");

    defaultJson = JSON.parse(data);
    return;
  });

  fs.readFile("./lazit.conf.json", "utf8", function (err, data) {
    if (err) throwError("Couldn't read the config json file");
    if (!data) throwError("Couldn't get the config JSON");

    data = JSON.parse(data);
    lazitConfigs = data;

    if (!data.setup) {
      lazitConfigs.setup = defaultJson.setup;
      console.log('setup', data.setup);
    }

    if (!data.settings) {
      lazitConfigs.settings = defaultJson.settings;
      console.log("settings", data.settings);
    }

    console.log(lazitConfigs);
    return;
  });
};

readJsons();

/* const init = async () => {
  await readJsons();
  console.log(lazitConfigs);
};

init(); */

/* const input = `
$mq-breakpoints: (
  "tabletV": 600px,
  "tabletH": 900px,
  "laptop": 1200px,
  "desktop": 1600px,
) !default;
`;

fs.writeFile("./sass/1_settings/_breakpoints.scss", input, (err) => {
  if (err) console.log(err);
}); */
