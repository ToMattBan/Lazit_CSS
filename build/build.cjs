#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const sass = require("sass");

const userPath = process.cwd();
const isDev = userPath.includes("Lazit_CSS");

const projectBasePath = path.join(userPath, isDev ? "" : "node_modules/lazit-css");
const baseSassPath = path.join(projectBasePath, "sass");

let rootVarsEnabled = [];

const throwError = (error) => {
  console.error(error);
  throw error;
};

const writeFile = async (content, filePath) => {
  try {
    await fs.writeFile(filePath, content);
  } catch (err) {
    throwError(err);
  }
};

const mergeAndDiscardDuplicates = (json1, json2) => {
  const mergedJson = { ...json2 };
  const notToMerge = ["rules", "breakpoints", "colors", "spacements"];

  for (const key in json1) {
    if (!mergedJson.hasOwnProperty(key)) {
      mergedJson[key] = json1[key];
    } else if (
      !notToMerge.includes(key) &&
      typeof json1[key] === "object" &&
      typeof mergedJson[key] === "object"
    ) {
      mergedJson[key] = mergeAndDiscardDuplicates(json1[key], mergedJson[key]);
    }
  }

  return mergedJson;
};

const readJsons = async () => {
  let defaultJson = {};

  try {
    const data = await fs.readFile(`${projectBasePath}/build/lazit_default.conf.json`, "utf8");

    if (!data) {
      throwError("Couldn't read the default JSON");
    }

    defaultJson = JSON.parse(data);
  } catch (err) {
    throwError("Couldn't get the default JSON file: " + err.message);
  }

  try {
    const data = await fs.readFile(`${userPath}/lazit.conf.json`, "utf8");

    if (!data) {
      lazitConfigs = defaultJson;
    } else {
      lazitConfigs = mergeAndDiscardDuplicates(defaultJson, JSON.parse(data));
    }

    buildLib(lazitConfigs);
  } catch (err) {
    buildLib(defaultJson);
  }
};

const buildCore = async (setupConfigs) => {
  let content = `$utilityPrefix: "${setupConfigs.prefix}";` +
    `\n$utilitySeparator: "${setupConfigs.separator}";` +
    `\n$defaultFontSize: ${setupConfigs.defaultFontSize};` +
    '\n$utilities: ();';

  rootVarsEnabled = Object.keys(setupConfigs.rootVars).filter(
    (vars) => vars !== "enabled" && setupConfigs.rootVars[vars]
  );

  if (setupConfigs.rootVars.enabled) {
    content += `\n$rootVars: ();`;
  }

  await writeFile(content, `${baseSassPath}/1_settings/_core.scss`);
};

const buildSettings = async (settingsConfigs) => {
  const settingsEnabled = ["core"];
  let content = "";

  if (settingsConfigs.breakpoints.enabled) {
    settingsEnabled.push("breakpoints");
    const breakpointConfigs = settingsConfigs.breakpoints;

    content += '$breakpoints: (';

    for (const [breakpoint, value] of Object.entries(breakpointConfigs.breakpoints)) {
      content += `\n"${breakpoint}": ${value},`;
    }

    content += '\n);' +
      `\n$breakpointSeparator: \\${breakpointConfigs.separator};`;

    await writeFile(content, `${baseSassPath}/1_settings/_breakpoints.scss`);
  }

  if (settingsConfigs.colors.enabled) {
    settingsEnabled.push("colors");
    const colorsConfigs = settingsConfigs.colors;

    let colorsJson = colorsConfigs.colors;

    if (colorsConfigs.includeHTMLColors) {
      try {
        const defaultColors = await fs.readFile(`${projectBasePath}/build/html-default-colors.json`, "utf8");

        if (!defaultColors) {
          throwError("Couldn't read the default colors JSON");
        }

        colorsJson = mergeAndDiscardDuplicates(JSON.parse(defaultColors), colorsConfigs.colors);
      } catch (err) {
        throwError("Couldn't get the default colors JSON file: " + err.message);
      }
    }

    content = '$colors: (';

    for (const [color, value] of Object.entries(colorsJson)) {
      content += `\n"${color}": ${value},`;
    }

    content += '\n);' +
      '\n@function getColor($key) {' +
      '\n  @return map.get($colors, $key);' +
      '\n}';

    for (const [mainColor, aliasColor] of Object.entries(colorsConfigs.colorAlias)) {
      content += `\n$colors: map.set($colors, "${mainColor}", getColor("${aliasColor}"));`;
    }

    if (rootVarsEnabled.includes("colors")) {
      content += `\n$rootVars: map.set($rootVars, 'color', $colors);`;
    }

    await writeFile(content, `${baseSassPath}/1_settings/_colors.scss`);
  }

  if (settingsConfigs.spacing.enabled) {
    settingsEnabled.push("spacing");
    const spacingConfigs = settingsConfigs.spacing;

    content = `$defaultSpacingValue: ${spacingConfigs.defaultSpacingValue};` +
      '\n$spacingFactors: (';

    for (const [spacing, value] of Object.entries(spacingConfigs.spacements)) {
      content += `\n"${spacing}": ${value},`;
    }

    content += '\n);' +
      '\n$spacing: ();' +
      '\n@each $spaceName, $spaceFactor in $spacingFactors {' +
      ' \n$spacing: map.set($spacing, $spaceName, $defaultSpacingValue * $spaceFactor);' +
      '\n}';

    if (rootVarsEnabled.includes("spacements")) {
      content += `\n$rootVars: map.set($rootVars, 'space', $spacing);`;
    }

    await writeFile(content, `${baseSassPath}/1_settings/_spacing.scss`);
  }

  content = "";
  for (const settings of settingsEnabled) {
    content += `\n@import './${settings}';`;
  }

  await writeFile(content, `${baseSassPath}/1_settings/_mainSettings.scss`);
};

const buildUtilities = async (utilityConfigs) => {
  const utilities = utilityConfigs.utilities;
  const utilitiesEnabled = [];

  if (utilityConfigs.enabled) {
    const checkUtilName = (name) => {
      if (name === "textColor") return "color";
      if (name === "backgroundColor") return "background-color";
      return name;
    };

    for (const [utility, utilName] of Object.entries(utilities)) {
      if (utilName.enabled) {
        utilitiesEnabled.push(utility);

        let content = `@mixin ${utility}Utility($breakpoint: null) {`;

        if (utilName.rules) {
          content += '\n$utilityRules: (';

          for (const [rule, value] of Object.entries(utilName.rules)) {
            content += `\n"${rule}": ${value},`;
          }

          content += '\n);';
        } else {
          switch (utility) {
            case "textColor":
            case "backgroundColor":
              content += '\n$utilityRules: $colors;';
              break;
            case "padding":
            case "margin":
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
      }
    }
  }

  let content = "";
  for (const utility of utilitiesEnabled) {
    content += `\n@import './${utility}';`;
  }

  await writeFile(content, `${baseSassPath}/7_utilities/_mainUtilities.scss`);
};

const compileSass = async () => {
  const inputFilePath = path.join(baseSassPath, "main.scss");
  const outputFilePath = path.join(projectBasePath, "public", "main.min.css");
  const outputMapPath = path.join(projectBasePath, "public", "main.min.css.map");

  const sassOptions = {
    style: "compressed",
    sourceMap: true,
  };

  try {
    const sassResult = sass.compile(inputFilePath, sassOptions);

    await Promise.all([
      fs.writeFile(outputFilePath, sassResult.css),
      fs.writeFile(outputMapPath, sassResult.sourceMap.toString()),
    ]);
  } catch (err) {
    throwError(err);
  }
};

const buildLib = async (lazitConfigs) => {
  try {
    await buildCore(lazitConfigs.setup);
    await buildSettings(lazitConfigs.settings);
    await buildUtilities(lazitConfigs.utilities);
    await compileSass();
  } catch (error) {
    console.log(error);
  } finally {
    console.log("Lazit build successful");
  }
};

async function runLazitBuilder() {
  try {
    await readJsons();
  } catch (error) {
    console.error(error);
  } finally {
    console.log('Lazit build completed.');
  }
}

// Call the function to start the script
runLazitBuilder();