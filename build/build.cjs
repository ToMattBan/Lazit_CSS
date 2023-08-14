var fs = require("fs");

var lazitConfigs = {};

const throwError = function (error) {
  console.error(error);
  throw error;
};

const writeFile = function (content, filePath) {
  fs.writeFile(filePath, content, (err) => {
    if (err) throwError(err);
  })
}

const readJsons = function () {
  let defaultJson = {};
  fs.readFile("./lazit_default.conf.json", "utf8", function (err, data) {
    if (err) return throwError("Couldn't get the default json file");
    if (!data) return throwError("Couldn't read the default JSON");

    defaultJson = JSON.parse(data);
    return;
  });

  fs.readFile("./lazit.conf.json", "utf8", function (err, data) {
    if (err) throwError("Couldn't get the config json file");
    if (!data) throwError("Couldn't read the config JSON");

    data = JSON.parse(data);
    lazitConfigs = data;

    for (key in defaultJson) {
      if(!data[key]) {
        lazitConfigs[key] = defaultJson[key];
      }
    }

    buildLib(lazitConfigs);
    return;
  });
};

const buildCore = function (setupConfigs) {
  const content = `$utilityPrefix: "${setupConfigs.prefix}";` +
    `\n$utilitySeparator: "${setupConfigs.separator}";` +
    `\n$defaultFontSize: ${setupConfigs.defaultFontSize};` +
    '\n$utilities: ();';

  writeFile(content, "./sass/1_settings/_core.scss");
}

const buildLib = function (lazitConfigs) {
  buildCore(lazitConfigs.setup);
}

readJsons();