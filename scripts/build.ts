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

const addBreakpoint = (breakpoint: IBreakPointConfig): string => breakpoint.name ? breakpoint.divisor + breakpoint.name : ''
//const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();


// Build Utilities Functions
function buildGrid(divisor: string, total: number, breakpoint: IBreakPointConfig): string {
  const escapedDivisor = '\\' + divisor;
  let gridRules = '';

  let i = 1;
  while (i <= total) {
    let ruleName = prefix + i + escapedDivisor + total + addBreakpoint(breakpoint);

    gridRules += `.${ruleName} {
      width: ${(i / total) * 100}%
    }`;

    i++;
  };

  return gridRules;
}

function buildColors(utilityName: string, shorthand: string, colors: Record<string, string>, breakpoint: IBreakPointConfig): string {
  let colorRules = '';

  for (const colorName in colors) {
    const hexValue = colors[colorName];

    const ruleName = prefix + shorthand + colorName + addBreakpoint(breakpoint);

    colorRules += `.${ruleName} {
      ${utilityName}: ${hexValue}
    }`;
  }

  return colorRules;
}

function buildDirections(utilityName: string, shorthand: string, directions: Record<string, string | string[]>, sizes: Record<string, string>, breakpoint: IBreakPointConfig): string {
  let directionRules = '';

  for (const direction in directions) {
    const dirValue = directions[direction];
    const isSingle = typeof dirValue === 'string';

    for (const size in sizes) {
      const sizeValue = sizes[size];
      const ruleName = prefix + shorthand + direction + size + addBreakpoint(breakpoint);

      if (isSingle) {
        directionRules += `.${ruleName} { ${utilityName}-${dirValue}: ${sizeValue} }`;
        continue;
      }

      const properties = dirValue.map(dir => `${utilityName}-${dir}: ${sizeValue};`).join(' ');
      directionRules += `.${ruleName} { ${properties} }`;
    }
  }

  return directionRules;
}

function buildSizes(utilityName: string, shorthand: string, sizes: Record<string, string>, breakpoint: IBreakPointConfig): string {
  let sizeRules = '';

  for (const size in sizes) {
    const sizeValue = sizes[size];
    const ruleName = prefix + shorthand + size + addBreakpoint(breakpoint);

    sizeRules += `.${ruleName} {
        ${utilityName}: ${sizeValue}
      }`;
  }

  return sizeRules;
}

// Init Build Function
function build(config: IConfig) {
  // TODO: Create validations
  // If utility of type color exists, config.colors NEED to exits too.
  // Can't have two utilities with same shorthand.

  // Parsing prefix it with \\ so "strange" chars like @ can be used
  if (config.prefix) prefix = '\\' + config.prefix;

  // Making an "empty" breakpoint rule that is the mobile values, folowwing mobile-first development
  config.responsive = {
    divisor: '\\' + (config.responsive?.divisor ?? ''),
    breakpoints: { '': 0, ...config.responsive?.breakpoints }
  };

  // Making an "empty" direction rule that is just the utility with all directions
  if (config.directions) {
    config.directions = {
      '': ['top', 'bottom', 'left', 'right'],
      ...config.directions
    }
  }

  const cssParts: string[] = [];

  // Putting collors on :root 
  if (config.colors) {
    let rootCss = `:root {`

    for (const color in config.colors) {
      rootCss += `--${color}: ${config.colors[color]};\n`
    }

    rootCss += '}'

    cssParts.push(rootCss);
  }

  for (const breakpoint in config.responsive.breakpoints) {
    let breakpointCss = '';
    if (breakpoint) breakpointCss += `@media (min-width: ${config.responsive.breakpoints[breakpoint]}) {`;

    const breakpointConfigs: IBreakPointConfig = {
      name: breakpoint,
      divisor: config.responsive.divisor
    }

    // Creating grid rules
    if (config.grid) {
      breakpointCss += buildGrid(config.grid.divisor, config.grid.total, breakpointConfigs);
    }

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
            breakpointCss += buildColors(utilityName, utilityConfigs.shorthand, config.colors, breakpointConfigs);
            break;
          case 'directional':
            if (!config.directions) return; // TODO: Remove this when the validatin is created
            if (!config.sizes) return; // TODO: Remove this when the validatin is created
            breakpointCss += buildDirections(utilityName, utilityConfigs.shorthand, config.directions, config.sizes, breakpointConfigs)
            break;
          case 'size':
            if (!config.sizes) return; // TODO: Remove this when the validatin is created
            breakpointCss += buildSizes(utilityName, utilityConfigs.shorthand, config.sizes, breakpointConfigs)
            break;
        }
      }
    }

    // TODO: margin, padding always add auto

    if (breakpoint) breakpointCss += '}';
    cssParts.push(breakpointCss);
  }

  // Building and minifying
  let { code } = transform({
    filename: 'style.css',
    minify: true,
    code: Buffer.from(cssParts.join(''))
  })

  // Saving the file
  const outputPath = path.join(__dirname, '..', 'public', 'style.min.css');
  fs.writeFileSync(outputPath, code);
}

export default build