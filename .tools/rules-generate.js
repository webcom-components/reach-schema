#!/usr/bin/env node

require('babel-core/register');

const extract = require('./utils/version').extract;
const execSync = require('child_process').execSync;

extract('rules').forEach((v) => {
	execSync(`./node_modules/.bin/firebase-bolt < ${v}/security/rules.bolt > ${v}/security/rules.json`, {
		cwd: `${__dirname}/..`,
		stdio: process.stdio
	});
});