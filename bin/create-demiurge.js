#!/usr/bin/env node
import { runCli } from "../src/index.js";

runCli(process.argv.slice(2)).catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
