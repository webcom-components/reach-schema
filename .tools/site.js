#!/usr/bin/env node

require('babel-core/register');

const list  = require('./version').list;
const template = require('dot').template;
const readFileSync  = require('fs').readFileSync;


const tpl = template(readFileSync(__dirname + '/index.dot').toString());

console.log(tpl({versions: ['latest'].concat(list)}));

process.exit(0);