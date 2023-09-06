#!/usr/bin/env node

const child_process = require('child_process');
var fs = require("fs");

var lazitConfigs = {};
const userPath = process.cwd();
const isDev = userPath.includes('Lazit_CSS');

const projectBasePath = userPath + `${isDev ? '' : '/node_modules/lazit-css'}`;
const baseSassPath = projectBasePath + "/sass";

const rootVarsEnabled = []

const throwError = function (error) {
  console.error(error);
  throw error;
};

const writeFile = function (content, filePath) {
  fs.writeFileSync(filePath, content, (err) => {
    if (err) throwError(err);
  })
};

const mergeAndDiscardDuplicates = function (json1, json2) {
  const mergedJson = { ...json2 };
  const notToMerge = ['rules', 'breakpoints', 'colors', 'spacements']

  for (const key in json1) {
    if (!mergedJson.hasOwnProperty(key)) {
      mergedJson[key] = json1[key];
    } else if (!notToMerge.includes(key) && typeof json1[key] === 'object' && typeof mergedJson[key] === 'object') {
      mergedJson[key] = mergeAndDiscardDuplicates(json1[key], mergedJson[key]);
    }
  }

  return mergedJson;
}

const readJsons = async function () {
  let defaultJson = {};

  try {
    const data = fs.readFileSync(`${projectBasePath}/build/lazit_default.conf.json`, 'utf8');
    if (!data) {
      return throwError("Couldn't read the default JSON");
    }

    defaultJson = JSON.parse(data);
  } catch (err) {
    return throwError("Couldn't get the default JSON file: " + err.message);
  }

  if (fs.existsSync(`${userPath}/lazit.conf.json`)) {
    try {
      const data = fs.readFileSync(`${userPath}/lazit.conf.json`, 'utf8');

      if (!data) {
        return throwError("Couldn't read the user JSON");
      }

      lazitConfigs = mergeAndDiscardDuplicates(defaultJson, JSON.parse(data));

      buildLib(lazitConfigs);
      return;
    } catch (err) {
      return throwError("Couldn't get the user JSON file: " + err.message);
    }
  } else {
    lazitConfigs = defaultJson
    buildLib(lazitConfigs);
    return;
  }
};

const buildCore = async function (setupConfigs) {
  let content = `$utilityPrefix: "${setupConfigs.prefix}";` +
    `\n$utilitySeparator: "${setupConfigs.separator}";` +
    `\n$defaultFontSize: ${setupConfigs.defaultFontSize};` +
    '\n$utilities: ();';

  if (setupConfigs.rootVars.enabled) {
    content += `\n$rootVars: ();`
  }

  for (var vars in setupConfigs.rootVars) {
    if (vars != 'enabled' && setupConfigs.rootVars[vars]) rootVarsEnabled.push(vars)
  }

  await writeFile(content, `${baseSassPath}/1_settings/_core.scss`);
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

    await writeFile(content, `${baseSassPath}/1_settings/_breakpoints.scss`);
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

    for (mainColor in colorsConfigs.colorAlias) {
      content += `\n$colors: map.set($colors, "${mainColor}", getColor("${colorsConfigs.colorAlias[mainColor]}"));`
    }

    if (rootVarsEnabled.includes('colors')) {
      content += `\n$rootVars: map.set($rootVars, 'color', $colors);`
    }

    await writeFile(content, `${baseSassPath}/1_settings/_colors.scss`);
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

    if (rootVarsEnabled.includes('spacements')) {
      content += `\n$rootVars: map.set($rootVars, 'space', $spacing);`
    }

    await writeFile(content, `${baseSassPath}/1_settings/_spacing.scss`);
  }

  let content = "";
  for (settings of settingsEnabled) {
    content += `\n@import './${settings}';`
  }

  await writeFile(content, `${baseSassPath}/1_settings/_mainSettings.scss`);
};

const buildUtilities = async function (utilityConfigs) {
  const utilities = utilityConfigs.utilities;
  const utilitiesEnabled = [];

  if (utilityConfigs.utilities.enabled) {
    function checkUtilName(name) {
      if (name == 'textColor') return 'color';
      if (name == 'backgroundColor') return 'background-color';
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
            case 'backgroundColor':
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

        await writeFile(content, `${baseSassPath}/7_utilities/_${utility}.scss`);

        content = "";
      }
    }
  }

  let content = "";
  for (utility of utilitiesEnabled) {
    content += `\n@import './${utility}';`
  }

  await writeFile(content, `${baseSassPath}/7_utilities/_mainUtilities.scss`);
}

const runSass = function () {
  try {
    const sassProcess = child_process.spawnSync('sass', [
      `${baseSassPath}/main.scss`, `${projectBasePath}/public/main.min.css`, `--style`, `compressed`
    ], {
      stdio: 'inherit',
    });

    if (sassProcess.error) {
      throw new Error(`Error running the script: ${sassProcess.error}`);
    }

    if (sassProcess.status !== 0) {
      throw new Error(`The script failed with status code: ${sassProcess.status}`);
    }

    console.log('Sass compilation completed successfully.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const buildLib = async function (lazitConfigs) {
  try {
    await buildCore(lazitConfigs.setup);
    await buildSettings(lazitConfigs.settings);
    await buildUtilities(lazitConfigs.utilities);
  } finally {
    runSass();
  }
};

readJsons();