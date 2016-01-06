#!/usr/bin/env node

require('babel-core/register');

console.log(require('./version').latest);

process.exit(0);