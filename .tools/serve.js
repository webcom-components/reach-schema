#!/usr/bin/env node

require('babel-core/register');

const version  = require('./version');
const prompt = require('inquirer').prompt;
const BrowserSync  = require('browser-sync');

if(version.list.length === 0) {
	process.exit(0);
} else {
	prompt(
		{
			type: 'list',
			name: 'version',
			message: 'Which draft version to display ?',
			choices: ['latest'].concat(version.list)
		},
		(answers) => {
			const v = version.get(answers.version);
			if(v){
				BrowserSync.create('draft').init({
					server: true,
					files: ['draft-*/*', 'legacy/*'],
					startPath: `bower_components/docson/#/../../${v}/reach.json`
				});
			}
		}
	);
}