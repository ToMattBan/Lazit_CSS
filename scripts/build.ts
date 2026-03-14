import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transform } from "lightningcss";

import { IConfig } from "../types/interfaces";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildGrid(prefix: string, divisor: string, total: number, breakpointName: string) {
  divisor = '\\' + divisor;
  let gridRules = '';

  let i = 1;
  while (i <= total) {
    let ruleName = prefix + i + divisor + total;
    if (breakpointName) ruleName += breakpointName;

    let rule = `.${ruleName} {
      width: ${(i / total) * 100}%
    }`;

    gridRules += rule.trim() + '\n';
    i++;
  };

  return gridRules;
}

function build(config: IConfig) {
  // Making sure that prefix exists, even as a empty string, and parse it with \\ so "strange" chars like @ can be used
  if (config.prefix) config.prefix = '\\' + config.prefix;
  else config.prefix = '';

  // Making a "empty" breakpoint rule that is the default values, the ones that don't use breakpoints at all
  config.responsive = {
    divisor: config.responsive?.divisor ?? '',
    breakpoints: { '': 0, ...config.responsive?.breakpoints }
  };

  let css = '';

  for (let breakpoint in config.responsive.breakpoints) {
    if (breakpoint) css += `@media (min-width: ${config.responsive.breakpoints[breakpoint]}) {`;

    const gridCss = config.grid ? buildGrid(config.prefix, config.grid.divisor, config.grid.total, breakpoint) : undefined;
    css += gridCss;

    if (breakpoint) css += '}';
  }

  let { code } = transform({
    filename: 'style.css',
    minify: true,
    code: Buffer.from(css)
  })

  const outputPath = path.join(__dirname, '..', 'public', 'style.min.css');
  fs.writeFileSync(outputPath, code);

  // margin, padding always add auto
}

export default build