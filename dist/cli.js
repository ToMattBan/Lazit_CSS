#!/usr/bin/env node
import "tsx/esm";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
const cwd = process.cwd();
const possibleConfigs = [
    "lazit.config.ts",
    "lazit.config.js",
    "lazit.config.mjs",
    "lazit.config.cjs"
];
async function run() {
    const configFile = possibleConfigs.find(file => fs.existsSync(path.join(cwd, file)));
    if (!configFile) {
        console.error("No lazit.config file found.");
        process.exit(1);
    }
    const configPath = path.join(cwd, configFile);
    try {
        await import(pathToFileURL(configPath).href);
    }
    catch (err) {
        console.error("Error running lazit.config:");
        console.error(err);
        process.exit(1);
    }
}
run();
