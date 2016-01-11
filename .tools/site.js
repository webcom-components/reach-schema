#!/usr/bin/env node

import {list, latest} from './version';
import {template} from 'dot';
import {readFileSync} from 'fs';

const tpl = template(readFileSync(`${__dirname}/index.dot`).toString());

console.log(tpl({versions: ['latest'].concat(list), latest}));

process.exit(0);