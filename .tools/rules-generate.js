#!/usr/bin/env node

import {extract} from './utils/version';
import {execSync} from 'child_process';

extract('rules').forEach((v) => {
	execSync(`./node_modules/.bin/firebase-bolt < ${v}/security/rules.bolt > ${v}/security/rules.json`, {
		cwd: `${__dirname}/..`,
		stdio: process.stdio
	});
});