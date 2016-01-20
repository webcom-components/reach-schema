#!/usr/bin/env node

import {schemas} from './utils/version';
import {template} from 'dot';
import {readFileSync, writeFileSync, statSync} from 'fs';

if(statSync(`${__dirname}/../out`).isDirectory()) {
	const tpl = template(readFileSync(`${__dirname}/index.dot`).toString());
	writeFileSync(
		`${__dirname}/../out/index.html`,
		tpl({versions: schemas})
	);
}