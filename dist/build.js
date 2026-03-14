import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transform } from "lightningcss";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let prefix = '';
const cssParts = [];
// Util Funcions
const kebabCache = new Map();
const toKebab = (value) => {
    if (kebabCache.has(value))
        return kebabCache.get(value);
    const result = value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    kebabCache.set(value, result);
    return result;
};
const addBreakpoint = (breakpoint) => breakpoint.name ? breakpoint.divisor + breakpoint.name : '';
const scapeName = (string) => string.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
// Build Utilities Functions
function buildGrid(divisor, total, breakpoint) {
    const escapedDivisor = scapeName(divisor);
    const breakPointValue = addBreakpoint(breakpoint);
    const step = 100 / total;
    let i = 1;
    while (i <= total) {
        let ruleName = prefix + i + escapedDivisor + total + breakPointValue;
        cssParts.push('.', ruleName, '{width:', String(i * step), '%}');
        i++;
    }
    ;
}
function buildUtility(utilityName, shorthand, values, breakpoint) {
    const breakPointValue = addBreakpoint(breakpoint);
    for (const utilValue in values) {
        const utilShorthand = values[utilValue];
        const ruleName = prefix + shorthand + utilShorthand + breakPointValue;
        cssParts.push('.', ruleName, '{', utilityName, ':', utilValue, '}');
    }
}
function buildColors(utilityName, shorthand, colors, breakpoint) {
    const breakPointValue = addBreakpoint(breakpoint);
    for (const colorName in colors) {
        const hexValue = colors[colorName];
        const ruleName = prefix + shorthand + colorName + breakPointValue;
        cssParts.push('.', ruleName, '{', utilityName, ':', hexValue, '}');
    }
}
function buildDirections(utilityName, shorthand, directions, sizes, breakpoint) {
    const dirKeys = Object.keys(directions);
    const sizeKeys = Object.keys(sizes);
    const breakPointValue = addBreakpoint(breakpoint);
    let d = 0;
    while (d < dirKeys.length) {
        const direction = dirKeys[d];
        const dirValue = directions[direction];
        const isSingle = typeof dirValue === 'string';
        let s = 0;
        while (s < sizeKeys.length) {
            const size = sizeKeys[s];
            const sizeValue = sizes[size];
            const ruleName = prefix + shorthand + direction + size + breakPointValue;
            if (isSingle) {
                cssParts.push('.', ruleName, '{', utilityName, '-', dirValue, ':', sizeValue, '}');
            }
            else {
                cssParts.push('.', ruleName, '{');
                for (const dir of dirValue) {
                    cssParts.push(utilityName, '-', dir, ':', sizeValue, ';');
                }
                cssParts.push('}');
            }
            s++;
        }
        d++;
    }
}
function buildSizes(utilityName, shorthand, sizes, breakpoint) {
    const breakPointValue = addBreakpoint(breakpoint);
    for (const size in sizes) {
        const sizeValue = sizes[size];
        const ruleName = prefix + shorthand + size + breakPointValue;
        cssParts.push('.', ruleName, '{', utilityName, ':', sizeValue, '}');
    }
}
// Init Build Function
function build(config) {
    // TODO: Create validations
    // If utility of type color exists, config.colors NEED to exits too.
    // Can't have two utilities with same shorthand.
    if (config.prefix)
        prefix = scapeName(config.prefix);
    // Making an "empty" breakpoint rule that is the mobile values, folowwing mobile-first development
    config.responsive = {
        divisor: scapeName(config.responsive?.divisor ?? ''),
        breakpoints: { '': 0, ...config.responsive?.breakpoints }
    };
    // Making an "empty" direction rule that is just the utility with all directions
    if (config.directions) {
        config.directions = {
            '': ['top', 'bottom', 'left', 'right'],
            ...config.directions
        };
    }
    // Putting collors on :root 
    if (config.colors) {
        cssParts.push(':root {');
        for (const color in config.colors) {
            cssParts.push('--', color, ':', config.colors[color] + ';');
        }
        cssParts.push('}');
    }
    for (const breakpoint in config.responsive.breakpoints) {
        if (breakpoint)
            cssParts.push('@media (min-width:', String(config.responsive.breakpoints[breakpoint]), '){');
        const breakpointConfigs = {
            name: breakpoint,
            divisor: config.responsive.divisor
        };
        // Creating grid rules
        if (config.grid) {
            buildGrid(config.grid.divisor, config.grid.total, breakpointConfigs);
        }
        // Creating utilities rules
        if (config.utilities) {
            for (const utility in config.utilities) {
                const utilityConfigs = config.utilities[utility];
                const utilityName = toKebab(utility);
                switch (utilityConfigs?.type) {
                    case undefined:
                    case 'value':
                        if (!utilityConfigs?.values)
                            return; // TODO: Remove this when the validation is created
                        buildUtility(utilityName, utilityConfigs.shorthand, utilityConfigs?.values, breakpointConfigs);
                        break;
                    case 'color':
                        if (!config.colors)
                            return; // TODO: Remove this when the validation is created
                        buildColors(utilityName, utilityConfigs.shorthand, config.colors, breakpointConfigs);
                        break;
                    case 'directional':
                        if (!config.directions)
                            return; // TODO: Remove this when the validatin is created
                        if (!config.sizes)
                            return; // TODO: Remove this when the validatin is created
                        buildDirections(utilityName, utilityConfigs.shorthand, config.directions, config.sizes, breakpointConfigs);
                        break;
                    case 'size':
                        if (!config.sizes)
                            return; // TODO: Remove this when the validatin is created
                        buildSizes(utilityName, utilityConfigs.shorthand, config.sizes, breakpointConfigs);
                        break;
                }
            }
        }
        if (breakpoint)
            cssParts.push('}');
    }
    // Building and minifying
    let { code } = transform({
        filename: 'style.css',
        minify: true,
        code: Buffer.from(cssParts.join(''))
    });
    // Saving the file
    const outputPath = path.join(__dirname, '..', 'public', 'style.min.css');
    fs.writeFileSync(outputPath, code);
}
export default build;
