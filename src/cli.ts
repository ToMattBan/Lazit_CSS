#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const cwd = process.cwd();

const possibleConfigs = [
  "lazit.config.ts",
  "lazit.config.js",
  "lazit.config.mjs"
];

async function run() {
  const configFile = possibleConfigs.find(file =>
    fs.existsSync(path.join(cwd, file))
  );

  if (!configFile) {
    console.error("No lazit.config file found.");
    process.exit(1);
  }

  const configPath = path.join(cwd, configFile);

  try {
    const configModule = await import(pathToFileURL(configPath).href);

    if (typeof configModule.default === "function") {
      configModule.default();
    } else {
      console.error(`${configFile} must export a default function.`);
    }

  } catch (err) {
    console.error("Error loading config:");
    console.error(err);
  }
}

run();