#!/usr/bin/env node

require('babel-core/register');

const version = require('./utils/version');
const template = require('dot').template;
const fs = require('fs');

if(fs.statSync(`${__dirname}/../out`).isDirectory()) {
	const tpl = template(fs.readFileSync(`${__dirname}/index.dot`).toString());
	fs.writeFileSync(
		`${__dirname}/../out/index.html`,
		tpl({versions: version.schemas, latest: version.latestSchema})
	);
}
