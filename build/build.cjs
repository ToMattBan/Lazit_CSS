#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const sass = require("sass");

class sassFunctions {
  static createList(name, list) {
    let result = `\n$${name}: (`;

    for (const [name, value] of Object.entries(list)) {
      result += `\n"${name}": ${value},`
    }

    result += '\n);';

    return result;
  };

  static newItemList(list, name, value) {
    const realValue = `map.set($${list}, "${name}", ${value})`
    return this.createVariable(list, realValue)
  };

  static createVariable(name, value) {
    if (value == "@") value = `\\${value}`;

    return `\n$${name}: ${value};`;
  };

  static createMainFile(filesToImport) {
    let result = "";

    for (const file of filesToImport) {
      result += `\n@import './${file}';`;
    }

    return result;
  };

  static createInclude(name, params) {
    return `\n@include ${name}(${params.join(',')})`;
  }
}

const LazitBuilder = new class LazitBuilder {
  constructor() {
    this.userPath = process.cwd();
    const isDev = process.argv.includes("--development");

    this.projectBasePath = path.join(this.userPath, isDev ? "" : "node_modules/lazit-css");
    this.baseSassPath = path.join(this.projectBasePath, "sass");

    this.rootVarsEnabled = [];
    this.init();
  };

  async init() {
    const lazitConfigs = await this.getConfigs();

    try {
      await Promise.all([
        this.buildCore(lazitConfigs.setup),
        this.buildSettings(lazitConfigs.settings),
        this.buildUtilities(lazitConfigs.utilities)
      ])

      this.compileSass();
    } catch (error) {
      console.error(error);
    } finally {
      console.log("Lazit build successful");
    }
  };


  /* Helpers */
  async writeFile(content, filePath) {
    try {
      await fs.writeFile(filePath, content);
    } catch (err) {
      throw err;
    }
  };

  async readFile(path) {
    try {
      const data = await fs.readFile(path, "utf8");

      if (!data) {
        throw `Couldn't read the content of ${path}`
      }

      return data;
    } catch (error) {
      throw `Couldn't open ${path}`
    }
  };

  mergeAndDiscardDuplicates(json1, json2) {
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
        mergedJson[key] = this.mergeAndDiscardDuplicates(json1[key], mergedJson[key]);
      }
    }

    return mergedJson;
  };

  checkUtilName(name) {
    name = name.replace(/([A-Z])/g, "-$1").toLowerCase();

    if (name === "text-color") return "color";

    return name;
  };


  /* Build functions */
  async getConfigs() {
    let lazitConfigs = await this.readFile(`${this.projectBasePath}/build/lazit_default.conf.json`);
    lazitConfigs = JSON.parse(lazitConfigs);

    try {
      const userConfigs = await this.readFile(`${this.userPath}/lazit.conf.json`)
      if (userConfigs) {
        lazitConfigs = this.mergeAndDiscardDuplicates(lazitConfigs, JSON.parse(userConfigs));
      }
    } catch (err) {
      console.log("User configs not found, using the default configs instead")
    }

    return lazitConfigs;
  };

  async buildCore(setupConfigs) {
    this.rootVarsEnabled = Object.keys(setupConfigs.rootVars).filter(
      (vars) => vars !== "enabled" && setupConfigs.rootVars[vars]
    );

    let content = `$utilityPrefix: "${setupConfigs.prefix}";` +
      `\n$utilitySeparator: "${setupConfigs.separator}";` +
      `\n$defaultFontSize: ${setupConfigs.defaultFontSize};` +
      `\n$utilities: ();`;

    if (setupConfigs.rootVars.enabled) {
      content += `\n$rootVars: ();`;
    }

    await this.writeFile(content, `${this.baseSassPath}/1_settings/_core.scss`);
  };

  async buildSettings(settingsConfigs) {
    const settingsEnabled = ["core"];

    if (settingsConfigs.breakpoints.enabled) {
      settingsEnabled.push("breakpoints");

      const breakpointConfigs = settingsConfigs.breakpoints;

      let content = sassFunctions.createList('breakpoints', breakpointConfigs.breakpoints);
      content += sassFunctions.createVariable('breakpointSeparator', breakpointConfigs.separator);

      await this.writeFile(content, `${this.baseSassPath}/1_settings/_breakpoints.scss`);
    }

    if (settingsConfigs.colors.enabled) {
      settingsEnabled.push("colors");

      const colorsConfigs = settingsConfigs.colors;

      let colorsJson = colorsConfigs.colors;

      if (colorsConfigs.includeHTMLColors) {
        const defaultColors = await this.readFile(`${projectBasePath}/build/html-default-colors.json`);
        if (defaultColors) {
          colorsJson = this.mergeAndDiscardDuplicates(JSON.parse(defaultColors), colorsConfigs.colors);
        }
      }

      let content = sassFunctions.createList('colors', colorsJson);
      for (const [mainColor, aliasColor] of Object.entries(colorsConfigs.colorAlias)) {
        content += sassFunctions.newItemList('colors', mainColor, `map.get($colors, "${aliasColor}")`)
      }

      if (this.rootVarsEnabled.includes("colors")) {
        content += sassFunctions.newItemList("rootVars", "color", "$colors")
      }

      await this.writeFile(content, `${this.baseSassPath}/1_settings/_colors.scss`);
    }

    if (settingsConfigs.spacing.enabled) {
      settingsEnabled.push("spacing");

      const spacingConfigs = settingsConfigs.spacing;
      const defaultMeasureUnit = spacingConfigs.defaultSpacingValue.replace(/\d/g, "");
      const defaultValue = spacingConfigs.defaultSpacingValue.replace(defaultMeasureUnit, "");

      let content = sassFunctions.createVariable('defaultSpacingValue', spacingConfigs.defaultSpacingValue);
      //content += sassFunctions.createList('spacingFactors', spacingConfigs.spacements);

      var listSpacements = [];
      Object.entries(spacingConfigs.spacements).forEach(value => {
        listSpacements[value[0]] = (value[1] * defaultValue) + defaultMeasureUnit
      })

      content += sassFunctions.createList('spacing', listSpacements)

      if (this.rootVarsEnabled.includes("spacements")) {
        content += sassFunctions.newItemList("rootVars", "space", "$spacing");
      }

      await this.writeFile(content, `${this.baseSassPath}/1_settings/_spacing.scss`);
    }

    const mainFile = sassFunctions.createMainFile(settingsEnabled);

    await this.writeFile(mainFile, `${this.baseSassPath}/1_settings/_mainSettings.scss`);
  };

  async buildUtilities(utilityConfigs) {
    const utilities = utilityConfigs.utilities;
    const utilitiesEnabled = [];

    if (utilityConfigs.enabled) {
      for (const [utilName, utility] of Object.entries(utilities)) {

        if (!utility.enabled) continue;

        utilitiesEnabled.push(utilName);

        let content = `@mixin ${utilName}Utility($breakpoint: null) {`;

        switch (utilName) {
          case "textColor":
          case "backgroundColor":
            content += sassFunctions.createVariable('utilityRules', '$colors');
            break;
          case "padding":
          case "margin":
            content += sassFunctions.createVariable('measureUnit', `"${utility.measureUnit}"`);
            content += sassFunctions.createVariable('utilityRules', 'convertSpaceList($spacing, $measureUnit)');
            content += sassFunctions.newItemList('utilityRules', '0', '0px');
            break;
          default:
            content += sassFunctions.createList('utilityRules', utility.rules);
            break;
        }

        content += sassFunctions.createInclude('createUtility', [`'${this.checkUtilName(utilName)}'`, `'${utility.initial}'`, '$utilityRules', '$breakpoint']);

        content += '\n}';
        content += sassFunctions.newItemList('utilities', utilName, `${utilName}Utility()`);

        await this.writeFile(content, `${this.baseSassPath}/7_utilities/_${utilName}.scss`);
      }
    }

    let content = sassFunctions.createMainFile(utilitiesEnabled);

    await this.writeFile(content, `${this.baseSassPath}/7_utilities/_mainUtilities.scss`);
  }

  async compileSass() {
    const inputFilePath = path.join(this.baseSassPath, "main.scss");
    const outputFilePath = path.join(this.projectBasePath, "public", "main.min.css");
    const outputMapPath = path.join(this.projectBasePath, "public", "main.min.css.map");

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
    } catch (error) {
      throw error;
    }
  }
}