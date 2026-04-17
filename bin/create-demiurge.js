#!/usr/bin/env node
import('../src/index.js').catch((e) => {
  console.error(e);
  process.exit(1);
});
