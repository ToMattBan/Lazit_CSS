import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transform } from "lightningcss";

import { IBreakPointConfig, IConfig } from "../types/interfaces";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let prefix = '';

// Util Funcions
const kebabCache = new Map<string, string>();
const toKebab = (value: string): string => {
  if (kebabCache.has(value)) return kebabCache.get(value)!;

  const result = value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  kebabCache.set(value, result);

  return result;
};

//const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();


// Build Utilities Functions
function buildGrid(divisor: string, total: number, breakpoint: IBreakPointConfig): string {
  divisor = '\\' + divisor;
  let gridRules = '';

  let i = 1;
  while (i <= total) {
    let ruleName = prefix + i + divisor + total;
    if (breakpoint.name) ruleName += breakpoint.divisor + breakpoint.name;

    let rule = `.${ruleName} {
      width: ${(i / total) * 100}%
    }`;

    gridRules += rule.trim() + '\n';
    i++;
  };

  return gridRules;
}

function buildColors(utilityName: string, shorthand: string, colors: { [key: string]: string; }, breakpoint: IBreakPointConfig): string {
  let colorRules = '';

  for (const color in colors) {
    //let ruleName = prefix + shorthand + (shorthand ? capitalize(color) : color);
    let ruleName = prefix + shorthand + color;
    if (breakpoint.name) ruleName += breakpoint.divisor + breakpoint.name;

    const hexValue = colors[color];

    let rule = `.${ruleName} {
      ${utilityName}: ${hexValue}
    }`;

    colorRules += rule;
  }

  return colorRules;
}


// Init Build Function
function build(config: IConfig) {
  // Making sure that prefix exists, even as a empty string, and parse it with \\ so "strange" chars like @ can be used
  if (config.prefix) prefix = '\\' + config.prefix;

  // Making a "empty" breakpoint rule that is the mobile values, folowwing mobile-first development
  config.responsive = {
    divisor: '\\' + (config.responsive?.divisor ?? ''),
    breakpoints: { '': 0, ...config.responsive?.breakpoints }
  };

  // TODO: Create validations
  // If utility of type color exists, config.colors NEED to exits too.
  // Can't have two utilities with same shorthand.

  let css = '';

  for (const breakpoint in config.responsive.breakpoints) {
    if (breakpoint) css += `@media (min-width: ${config.responsive.breakpoints[breakpoint]}) {`;

    const breakpointConfigs: IBreakPointConfig = {
      name: breakpoint,
      divisor: config.responsive.divisor
    }

    // Creating grid rules
    const gridCss = config.grid ? buildGrid(config.grid.divisor, config.grid.total, breakpointConfigs) : undefined;
    css += gridCss;

    // Creating utilities rules
    if (config.utilities) {
      for (const utility in config.utilities) {
        const utilityConfigs = config.utilities[utility as keyof typeof config.utilities];
        const utilityName = toKebab(utility);

        switch (utilityConfigs?.type) {
          case undefined:
          case 'value':
            break;
          case 'color':
            if (!config.colors) return; // TODO: Remove this when the validation is created
            const colorRules = buildColors(utilityName, utilityConfigs.shorthand, config.colors, breakpointConfigs)
            css += colorRules
            break;
          case 'directional':
            break;
          case 'size':
            break;
        }
      }
    }

    // TODO: margin, padding always add auto

    if (breakpoint) css += '}';
  }

  // Building and minifying
  let { code } = transform({
    filename: 'style.css',
    //minify: true,
    code: Buffer.from(css)
  })

  // Saving the file
  const outputPath = path.join(__dirname, '..', 'public', 'style.min.css');
  fs.writeFileSync(outputPath, code);
}

export default build