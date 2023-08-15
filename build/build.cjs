var fs = require("fs");

var lazitConfigs = {};
const projectBasePath = process.cwd();
const baseSassPath = projectBasePath + "/sass";

const throwError = function (error) {
  console.error(error);
  throw error;
};

const writeFile = function (content, filePath, sync = false) {
  if (sync) {
    fs.writeFileSync(filePath, content, (err) => {
      if (err) throwError(err);
    })
  } else {
    fs.writeFile(filePath, content, (err) => {
      if (err) throwError(err);
    })
  }
};

const mergeAndDiscardDuplicates = function (json1, json2) {
  const mergedJson = { ...json2 };

  for (const key in json1) {
    if (!mergedJson.hasOwnProperty(key)) {
      mergedJson[key] = json1[key];
    } else if (typeof json1[key] === 'object' && typeof mergedJson[key] === 'object') {
      mergedJson[key] = mergeAndDiscardDuplicates(json1[key], mergedJson[key]);
    }
  }

  return mergedJson;
}

const readJsons = function () {
  let defaultJson = {};
  fs.readFile(`${projectBasePath}/build/lazit_default.conf.json`, "utf8", function (err, data) {
    if (err) return throwError("Couldn't get the default json file");
    if (!data) return throwError("Couldn't read the default JSON");

    defaultJson = JSON.parse(data);
    return;
  });

  fs.readFile(`${projectBasePath}/lazit.conf.json`, "utf8", function (err, data) {
    if (err) throwError("Couldn't get the config json file");
    if (!data) throwError("Couldn't read the config JSON");

    data = JSON.parse(data);
    lazitConfigs = mergeAndDiscardDuplicates(defaultJson, data);

    buildLib(lazitConfigs);
    return;
  });
};

const buildCore = function (setupConfigs) {
  const content = `$utilityPrefix: "${setupConfigs.prefix}";` +
    `\n$utilitySeparator: "${setupConfigs.separator}";` +
    `\n$defaultFontSize: ${setupConfigs.defaultFontSize};` +
    '\n$utilities: ();';

  writeFile(content, `${baseSassPath}/1_settings/_core.scss`);
};

const buildSettings = async function (settingsConfigs) {
  const settingsEnabled = ['core'];

  if (settingsConfigs.breakpoints.enabled) {
    settingsEnabled.push('breakpoints')
    const breakpointConfigs = settingsConfigs.breakpoints;
    let content = '$mq-breakpoints: (';

    for (breakpoint in breakpointConfigs.breakpoints) {
      content += `\n"${breakpoint}": ${breakpointConfigs.breakpoints[breakpoint]},`;
    }

    content += '\n);' +
      `\n$breakpointSeparator: \\${breakpointConfigs.separator};`

    writeFile(content, `${baseSassPath}/1_settings/_breakpoints.scss`);
  }

  if (settingsConfigs.colors.enabled) {
    settingsEnabled.push('colors')
    const colorsConfigs = settingsConfigs.colors;
    let colorsJson = colorsConfigs.colors;

    if (colorsConfigs.includeHTMLColors) {
      let defaultColors = await fs.readFileSync(`${projectBasePath}/build/html-defaullt-colors.json`, "utf8", function (err, data) {
        if (err) return throwError("Couldn't get the default colors JSON");
        if (!data) return throwError("Couldn't read the default colors JSON");

        defaultColors = JSON.parse(data);
        return defaultColors;
      });

      defaultColors = JSON.parse(defaultColors);
      colorsJson = mergeAndDiscardDuplicates(defaultColors, colorsConfigs.colors);
    }

    let content = '$colors: (';
    for (color in colorsJson) {
      content += `\n"${color}": ${colorsJson[color]},`;
    }
    content += '\n);' +
      '\n@function getColor($key) {' +
      '\n  @return map.get($colors, $key);' +
      '\n}';

    for (mainColor in colorsConfigs.projectMainColors) {
      content += `\n$colors: map.set($colors, "${mainColor}", getColor("${colorsConfigs.projectMainColors[mainColor].sameAs}"));`
    }

    writeFile(content, `${baseSassPath}/1_settings/_colors.scss`);
  }

  if (settingsConfigs.spacing.enabled) {
    settingsEnabled.push('spacing')
    const spacingConfigs = settingsConfigs.spacing;

    let content = `$defaultSpacingValue: ${spacingConfigs.defaultSpacingValue};` +
      '\n$spacingFactors: (';

    for (spacing in spacingConfigs.spacements) {
      content += `\n"${spacing}": ${spacingConfigs.spacements[spacing]},`
    }

    content += '\n);' +
      '\n$spacing: ();' +
      '\n@each $spaceName, $spaceFactor in $spacingFactors {' +
      ' \n$spacing: map.set($spacing, $spaceName, $defaultSpacingValue * $spaceFactor);' +
      '\n}';

    writeFile(content, `${baseSassPath}/1_settings/_spacing.scss`);
  }

  let content = "";
  for (settings of settingsEnabled) {
    content += `\n@import './${settings}';`
  }

  writeFile(content, `${baseSassPath}/1_settings/_mainSettings.scss`);
};

const buildUtilities = function (utilityConfigs) {
  const utilities = utilityConfigs.utilities;
  const utilitiesEnabled = [];

  if (lazitConfigs.utilities.enabled) {
    function checkUtilName(name) {
      if (name == 'textColor') return 'color';
      return name;
    }

    for (utility in utilities) {
      const utilName = utilities[utility]
      if (utilName.enabled) {
        utilitiesEnabled.push(utility);

        let content = `@mixin ${utility}Utility($breakpoint: null) {`;

        if (utilName.rules) {
          content += '\n$utilityRules: (';

          for (rule in utilName.rules) {
            content += `\n"${rule}": ${utilName.rules[rule]},`;
          }
          content += '\n);';
        } else {
          switch (utility) {
            case 'textColor':
              content += '\n$utilityRules: $colors;';
              break;
            case 'padding':
            case 'margin':
              content += `\n$measureUnit: "${utilName.measureUnit}";` +
                '\n$utilityRules: convertSpaceList($spacing, $measureUnit);';
              break;
            default:
              break;
          }
        }

        content += `\n@include createUtility('${checkUtilName(utility)}', '${utilName.initial}', $utilityRules, $breakpoint);` +
          '\n}' +
          `\n$utilities: map.set($utilities, '${utility}', ${utility}Utility());`;

        writeFile(content, `${baseSassPath}/7_utilities/_${utility}.scss`, true);

        content = "";
      }
    }
  }

  let content = "";
  for (utility of utilitiesEnabled) {
    content += `\n@import './${utility}';`
  }

  writeFile(content, `${baseSassPath}/7_utilities/_mainUtilities.scss`)
}

const buildLib = function (lazitConfigs) {
  buildCore(lazitConfigs.setup);
  buildSettings(lazitConfigs.settings);
  buildUtilities(lazitConfigs.utilities);
};

readJsons();